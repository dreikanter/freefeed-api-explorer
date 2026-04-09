<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { ApiEndpoint, ApiRequest, ApiResponse, ApiParameter } from '$lib/types.js';
  import { API_ENDPOINTS } from '$lib/api-endpoints.js';
  import {
    tokens,
    activeTokenId,
    activeToken,
    selectedInstance,
    currentRequest,
    isLoading,
    addToHistory,
    requestHistory,
    searchQuery,
    selectedScope,
  } from '$lib/stores.js';
  import type { SavedToken } from '$lib/types.js';
  import Response from './Response.svelte';
  import RequestListItem from './RequestListItem.svelte';
  import { initHighlight, hljs } from '$lib/highlight.js';
  import { endpointToId, idToEndpoint } from '$lib/utils.js';
  import 'highlight.js/styles/github.css';
  import 'highlightjs-copy/dist/highlightjs-copy.min.css';

  let selectedEndpoint: ApiEndpoint | null = $state.raw(null);
  let parameters: Record<string, string> = $state({});
  let activeTab: 'request' | 'fetch' | 'curl' = $state('request');

  // Find most recent response for the currently selected endpoint
  let endpointResponse = $derived(
    selectedEndpoint
      ? $requestHistory.find(
          (req) => req.endpoint.method === selectedEndpoint!.method && req.endpoint.path === selectedEndpoint!.path
        )
      : null
  );

  let filteredEndpoints = $derived(
    API_ENDPOINTS.filter((endpoint) => {
      const matchesSearch =
        !$searchQuery ||
        endpoint.path.toLowerCase().includes($searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes($searchQuery.toLowerCase());
      const matchesScope = !$selectedScope || endpoint.scopes.includes($selectedScope);
      return matchesSearch && matchesScope;
    })
  );

  const scopes = [...new Set(API_ENDPOINTS.flatMap((e) => e.scopes))].sort();

  // Group tokens by instance URL, preserving token order
  let tokensByInstance = $derived(
    $tokens.reduce<{ instance: string; tokens: SavedToken[] }[]>((groups, token) => {
      const existing = groups.find((g) => g.instance === token.instance.url);
      if (existing) {
        existing.tokens.push(token);
      } else {
        groups.push({ instance: token.instance.url, tokens: [token] });
      }
      return groups;
    }, [])
  );

  // Watch for URL changes and update selected endpoint.
  // Use untrack for state reads so the effect only reacts to URL changes,
  // not to its own writes.
  $effect(() => {
    const endpointParam = $page.url.searchParams.get('endpoint');
    if (endpointParam) {
      // Try new URL-friendly format first
      let found = idToEndpoint(endpointParam, API_ENDPOINTS);

      // Fall back to old format for backwards compatibility
      if (!found && endpointParam.includes(':')) {
        const [method, path] = endpointParam.split(':', 2);
        found = API_ENDPOINTS.find((ep) => ep.method === method && ep.path === path) || null;
      }

      if (found && found !== untrack(() => selectedEndpoint)) {
        selectedEndpoint = found;
        const newParams: Record<string, string> = {};
        found.parameters?.forEach((param: ApiParameter) => {
          if (param.required) {
            newParams[param.name] = '';
          }
        });
        parameters = newParams;
        activeTab = 'request';
      }
    } else if (!endpointParam && untrack(() => selectedEndpoint)) {
      selectedEndpoint = null;
    }
  });

  function closeOffcanvas() {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('sidebarOffcanvas');
      // @ts-expect-error - Bootstrap is loaded via CDN
      const offcanvas = window.bootstrap.Offcanvas.getInstance(el);
      offcanvas?.hide();
    }
  }

  function selectEndpoint(endpoint: ApiEndpoint) {
    selectedEndpoint = endpoint;
    parameters = {};
    endpoint.parameters?.forEach((param) => {
      if (param.required) {
        parameters[param.name] = '';
      }
    });
    activeTab = 'request';

    // Update URL with selected endpoint using URL-friendly ID
    const url = new URL($page.url);
    url.searchParams.set('endpoint', endpointToId(endpoint));
    goto(url.toString(), { replaceState: true });
  }

  function generateUrl(): string {
    if (!selectedEndpoint || !$selectedInstance) return '';

    let path = selectedEndpoint.path;
    for (const param of selectedEndpoint.parameters) {
      if (param.location === 'path') {
        path = path.replace(`:${param.name}`, encodeURIComponent(parameters[param.name] || ''));
      }
    }

    const url = new URL(path, $selectedInstance.url);

    for (const param of selectedEndpoint.parameters) {
      if (param.location === 'query' && parameters[param.name]) {
        url.searchParams.set(param.name, parameters[param.name]);
      }
    }

    return url.toString();
  }

  async function executeRequest() {
    if (!selectedEndpoint || !$activeToken?.value || !$selectedInstance) return;

    const requestId = crypto.randomUUID();
    const url = generateUrl();

    const request: ApiRequest = {
      id: requestId,
      timestamp: Date.now(),
      instance: $selectedInstance,
      endpoint: selectedEndpoint,
      parameters: { ...parameters },
    };

    $currentRequest = request;
    $isLoading = true;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${$activeToken!.value}`,
        Accept: 'application/json',
        'User-Agent': 'FreeFeed-API-Explorer',
      };

      let body: string | undefined;
      if (selectedEndpoint.method !== 'GET') {
        const bodyParams: Record<string, string> = {};
        for (const param of selectedEndpoint.parameters) {
          if (param.location === 'body' && parameters[param.name]) {
            bodyParams[param.name] = parameters[param.name];
          }
        }
        if (Object.keys(bodyParams).length > 0) {
          body = JSON.stringify(bodyParams);
          headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(url, {
        method: selectedEndpoint.method,
        headers,
        body,
      });

      const responseBody = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const apiResponse: ApiResponse = {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
        timestamp: Date.now(),
      };

      request.response = apiResponse;
      $currentRequest = request;
      addToHistory(request);
    } catch (error) {
      const apiResponse: ApiResponse = {
        status: 0,
        headers: {},
        body: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        timestamp: Date.now(),
      };
      request.response = apiResponse;
      $currentRequest = request;
      addToHistory(request);
    } finally {
      $isLoading = false;
    }
  }

  function generateFetchCode(): string {
    if (!selectedEndpoint || !$selectedInstance) return '';

    const url = generateUrl();
    const headers: Record<string, string> = {
      Authorization: `Bearer YOUR_TOKEN_HERE`,
      Accept: 'application/json',
      'User-Agent': 'FreeFeed-API-Explorer',
    };

    let body: string | undefined;
    if (selectedEndpoint.method !== 'GET') {
      const bodyParams: Record<string, string> = {};
      for (const param of selectedEndpoint.parameters) {
        if (param.location === 'body' && parameters[param.name]) {
          bodyParams[param.name] = parameters[param.name];
        }
      }
      if (Object.keys(bodyParams).length > 0) {
        body = JSON.stringify(bodyParams, null, 2);
        headers['Content-Type'] = 'application/json';
      }
    }

    return `fetch('${url}', {
  method: '${selectedEndpoint.method}',
  headers: ${JSON.stringify(headers, null, 2)}${
    body
      ? `,
  body: ${body}`
      : ''
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
  }

  function generateCurlCode(): string {
    if (!selectedEndpoint || !$selectedInstance) return '';

    const url = generateUrl();
    let command = `curl -v \\
  -X ${selectedEndpoint.method} \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Accept: application/json" \\
  -H "User-Agent: FreeFeed-API-Explorer"`;

    if (selectedEndpoint.method !== 'GET') {
      const bodyParams: Record<string, string> = {};
      for (const param of selectedEndpoint.parameters) {
        if (param.location === 'body' && parameters[param.name]) {
          bodyParams[param.name] = parameters[param.name];
        }
      }
      if (Object.keys(bodyParams).length > 0) {
        command += ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(bodyParams)}'`;
      }
    }

    command += ` \\
  "${url}"`;

    return command;
  }

  $effect(() => {
    initHighlight();
  });

  $effect(() => {
    // Re-highlight when tab or response changes
    void activeTab;
    void endpointResponse;
    if (typeof window !== 'undefined') {
      queueMicrotask(() => hljs.highlightAll());
    }
  });
</script>

<div class="split-layout">
  <!-- Left Sidebar: API Endpoints (desktop) -->
  <div class="split-sidebar hide-below-md border-end">
    <div class="scrollable-column">
      <!-- Search and Filter -->
      <div class="p-2 border-bottom">
        <input type="text" class="form-control mb-2" placeholder="Search endpoints..." bind:value={$searchQuery} />
        <select class="form-select" bind:value={$selectedScope}>
          <option value="">All Scopes</option>
          {#each scopes as scope}
            <option value={scope}>{scope}</option>
          {/each}
        </select>
      </div>

      <!-- Endpoints List -->
      <div class="list-group list-group-flush">
        {#each filteredEndpoints as endpoint}
          <RequestListItem
            {endpoint}
            isSelected={selectedEndpoint === endpoint}
            onClick={() => selectEndpoint(endpoint)}
          />
        {/each}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="split-main">
    <div class="scrollable-column px-2 pt-2">
      {#if selectedEndpoint}
        <div class="card mb-2">
          <h5 class="card-header font-monospace">
            <strong>{selectedEndpoint.method}</strong>
            {selectedEndpoint.path}
          </h5>
          <div class="card-body">
            <p class="card-text">{selectedEndpoint.description}</p>
            <p>
              Scope: {#each selectedEndpoint.scopes as s}<span class="badge bg-info me-1">{s}</span>{/each}
            </p>

            <!-- Parameters -->
            {#if selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0}
              <h6 class="mt-4 mb-2">Parameters:</h6>
              {#each selectedEndpoint.parameters as param}
                <div class="mb-3">
                  <label for="param-{param.name}" class="form-label">
                    <code class="px-1">{param.name}</code>
                    {#if param.required}<span class="text-danger">*</span>{/if}
                    {#if param.description}<small class="text-muted ms-1">{param.description}</small>{/if}
                  </label>
                  {#if param.type === 'number'}
                    <input
                      id="param-{param.name}"
                      type="number"
                      class="form-control"
                      bind:value={parameters[param.name]}
                      placeholder=""
                      required={param.required}
                    />
                  {:else if param.type === 'boolean'}
                    <select
                      id="param-{param.name}"
                      class="form-select"
                      bind:value={parameters[param.name]}
                      required={param.required}
                    >
                      <option value="">Select...</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  {:else}
                    <input
                      id="param-{param.name}"
                      type="text"
                      class="form-control"
                      bind:value={parameters[param.name]}
                      placeholder=""
                      required={param.required}
                    />
                  {/if}
                </div>
              {/each}
            {/if}
          </div>

          <!-- Tabs: Request / Code Examples -->
          <ul class="nav nav-tabs px-3" role="tablist">
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                class:active={activeTab === 'request'}
                onclick={() => (activeTab = 'request')}
                type="button"
                role="tab"
              >
                Request
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                class:active={activeTab === 'fetch'}
                onclick={() => (activeTab = 'fetch')}
                type="button"
                role="tab"
              >
                fetch call
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button
                class="nav-link"
                class:active={activeTab === 'curl'}
                onclick={() => (activeTab = 'curl')}
                type="button"
                role="tab"
              >
                curl command
              </button>
            </li>
          </ul>
          <div class="tab-content p-3">
            {#if activeTab === 'request'}
              <div class="tab-pane active" role="tabpanel">
                {#if $tokens.length === 0}
                  <div class="alert alert-warning small mb-3" role="alert">
                    <i class="bi bi-exclamation-triangle"></i>
                    No tokens configured —
                    <a href="/tokens">add one</a>
                     to start making API requests.
                  </div>
                {/if}
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  {#if $tokens.length > 0}
                    <select
                      class="form-select form-select-sm"
                      style="width: auto; min-width: 14rem"
                      value={$activeTokenId}
                      onchange={(e) => activeTokenId.set(e.currentTarget.value)}
                    >
                      {#each tokensByInstance as group}
                        <optgroup label={group.instance}>
                          {#each group.tokens as token}
                            <option value={token.id}>
                              {token.label} — {new URL(token.instance.url).hostname}
                            </option>
                          {/each}
                        </optgroup>
                      {/each}
                    </select>
                  {:else}
                    <select class="form-select form-select-sm" style="width: auto; min-width: 14rem" disabled>
                      <option>No available tokens</option>
                    </select>
                  {/if}
                  <button
                    class="btn btn-success btn-sm"
                    onclick={executeRequest}
                    disabled={$isLoading || !$activeToken?.value}
                  >
                    {$isLoading ? 'Executing...' : 'Execute'}
                  </button>
                </div>
                {#if endpointResponse}
                  <div class="mt-3">
                    <Response request={endpointResponse} />
                  </div>
                {/if}
              </div>
            {:else if activeTab === 'fetch'}
              <div class="tab-pane active" role="tabpanel">
                <pre class="m-0 p-2 rounded small"><code class="language-javascript">{generateFetchCode()}</code></pre>
              </div>
            {:else if activeTab === 'curl'}
              <div class="tab-pane active" role="tabpanel">
                <pre class="m-0 p-2 rounded small"><code class="language-bash">{generateCurlCode()}</code></pre>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="card">
          <div class="card-body text-center text-muted py-5">
            <h3>Welcome to FreeFeed API Explorer</h3>
            <p>Select an API endpoint from the sidebar to get started.</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Mobile Offcanvas Sidebar -->
<div class="offcanvas offcanvas-start" tabindex="-1" id="sidebarOffcanvas" aria-labelledby="sidebarOffcanvasLabel">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="sidebarOffcanvasLabel">API Endpoints</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body p-0">
    <div class="p-3">
      <input type="text" class="form-control mb-2" placeholder="Search endpoints..." bind:value={$searchQuery} />
      <select class="form-select" bind:value={$selectedScope}>
        <option value="">All Scopes</option>
        {#each scopes as scope}
          <option value={scope}>{scope}</option>
        {/each}
      </select>
    </div>
    <div class="list-group list-group-flush border-top">
      {#each filteredEndpoints as endpoint}
        <RequestListItem
          {endpoint}
          isSelected={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method}
          onClick={() => {
            selectEndpoint(endpoint);
            closeOffcanvas();
          }}
        />
      {/each}
    </div>
  </div>
</div>
