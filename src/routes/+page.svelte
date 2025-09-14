<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { ApiEndpoint, ApiRequest, ApiResponse, FreeFeedInstance } from '$lib/types.js';
  import { API_ENDPOINTS, FREEFEED_INSTANCES } from '$lib/api-endpoints.js';
  import {
    token,
    selectedInstance,
    currentRequest,
    isLoading,
    clearToken,
    addToHistory,
  } from '$lib/stores.js';
  import Response from '$lib/components/Response.svelte';
  import NavigationBar from '$lib/components/NavigationBar.svelte';
  import MethodBadge from '$lib/components/MethodBadge.svelte';

  let searchQuery = '';
  let selectedScope = '';
  let filteredEndpoints: ApiEndpoint[] = API_ENDPOINTS;
  let selectedEndpoint: ApiEndpoint | null = null;
  let parameters: Record<string, string> = {};
  let showCodeGeneration = false;
  let generatedCode = '';

  $: {
    filteredEndpoints = API_ENDPOINTS.filter((endpoint) => {
      const matchesSearch =
        !searchQuery ||
        endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScope = !selectedScope || endpoint.scope === selectedScope;
      return matchesSearch && matchesScope;
    });
  }

  const scopes = [...new Set(API_ENDPOINTS.map((e) => e.scope))].sort();

  // Watch for URL changes and update selected endpoint
  $: {
    const endpointParam = $page.url.searchParams.get('endpoint');
    if (endpointParam && endpointParam.includes(':')) {
      const [method, path] = endpointParam.split(':', 2);
      const found = API_ENDPOINTS.find(ep => ep.method === method && ep.path === path);
      if (found && found !== selectedEndpoint) {
        selectedEndpoint = found;
        parameters = {};
        found.parameters?.forEach((param) => {
          if (param.required) {
            parameters[param.name] = param.example || '';
          }
        });
        showCodeGeneration = false;
      }
    } else if (!endpointParam && selectedEndpoint) {
      selectedEndpoint = null;
    }
  }

  function selectEndpoint(endpoint: ApiEndpoint) {
    selectedEndpoint = endpoint;
    parameters = {};
    endpoint.parameters?.forEach((param) => {
      if (param.required) {
        parameters[param.name] = param.example || '';
      }
    });
    showCodeGeneration = false;

    // Update URL with selected endpoint
    const url = new URL($page.url);
    url.searchParams.set('endpoint', `${endpoint.method}:${endpoint.path}`);
    goto(url.toString(), { replaceState: true });
  }

  function generateUrl(): string {
    if (!selectedEndpoint || !$selectedInstance) return '';

    let path = selectedEndpoint.path;
    if (selectedEndpoint.parameters) {
      for (const param of selectedEndpoint.parameters) {
        if (path.includes(`:${param.name}`)) {
          path = path.replace(`:${param.name}`, encodeURIComponent(parameters[param.name] || ''));
        }
      }
    }

    const url = new URL(path, $selectedInstance.url);

    if (selectedEndpoint.method === 'GET' && selectedEndpoint.parameters) {
      for (const param of selectedEndpoint.parameters) {
        if (!path.includes(`:${param.name}`) && parameters[param.name]) {
          url.searchParams.set(param.name, parameters[param.name]);
        }
      }
    }

    return url.toString();
  }

  async function executeRequest() {
    if (!selectedEndpoint || !$token || !$selectedInstance) return;

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
        Authorization: `Bearer ${$token}`,
        Accept: 'application/json',
        'User-Agent': 'FreeFeed-API-Explorer',
      };

      let body: string | undefined;
      if (selectedEndpoint.method !== 'GET' && selectedEndpoint.parameters) {
        const bodyParams: Record<string, string> = {};
        for (const param of selectedEndpoint.parameters) {
          if (!selectedEndpoint.path.includes(`:${param.name}`) && parameters[param.name]) {
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
        body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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
    if (selectedEndpoint.method !== 'GET' && selectedEndpoint.parameters) {
      const bodyParams: Record<string, string> = {};
      for (const param of selectedEndpoint.parameters) {
        if (!selectedEndpoint.path.includes(`:${param.name}`) && parameters[param.name]) {
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

    if (selectedEndpoint.method !== 'GET' && selectedEndpoint.parameters) {
      const bodyParams: Record<string, string> = {};
      for (const param of selectedEndpoint.parameters) {
        if (!selectedEndpoint.path.includes(`:${param.name}`) && parameters[param.name]) {
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

  function showCode(type: 'fetch' | 'curl') {
    const newCode = type === 'fetch' ? generateFetchCode() : generateCurlCode();
    if (showCodeGeneration && generatedCode === newCode) {
      showCodeGeneration = false;
    } else {
      generatedCode = newCode;
      showCodeGeneration = true;
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }


  onMount(() => {
    if (!$token) {
      // @ts-ignore - Bootstrap is loaded via CDN
      const modal = new window.bootstrap.Modal(document.getElementById('tokenModal'));
      modal.show();
    }
  });
</script>

<svelte:head>
  <title>FreeFeed API Explorer</title>
</svelte:head>

  <NavigationBar currentPage="home" />

<div class="container-fluid mb-4">
  <div class="row">
    <!-- Left Sidebar: API Endpoints -->
    <div class="col-md-4">
      <div class="card">
        <h5 class="card-header">API Endpoints</h5>
        <div class="card-body p-0">
          <!-- Search and Filter -->
          <div class="p-3">
            <input
              type="text"
              class="form-control mb-2"
              placeholder="Search endpoints..."
              bind:value={searchQuery}
            />
            <select class="form-select" bind:value={selectedScope}>
              <option value="">All Scopes</option>
              {#each scopes as scope}
                <option value={scope}>{scope}</option>
              {/each}
            </select>
          </div>

          <!-- Endpoints List -->
          <div class="list-group list-group-flush border-top">
            {#each filteredEndpoints as endpoint}
              <button
                class="list-group-item list-group-item-action {selectedEndpoint === endpoint
                  ? 'active'
                  : ''}"
                on:click={() => selectEndpoint(endpoint)}
              >
                <h6 class="fw-normal">
                  <strong>
                    <MethodBadge {endpoint} pathClass="font-monospace" />
                  </strong>
                </h6>
                <p class="mb-1 small">{endpoint.description}</p>
                <small class="text-muted">{endpoint.scope}</small>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="col-md-8">
      {#if selectedEndpoint}
        <div class="card mb-4">
          <h5 class="card-header">{selectedEndpoint.method} {selectedEndpoint.path}</h5>
          <div class="card-body">
            <p class="card-text">{selectedEndpoint.description}</p>
            <p>
              Scope: <span class="badge bg-info">{selectedEndpoint.scope}</span>
            </p>

            <!-- Parameters -->
            {#if selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0}
              <h6 class="mt-4 mb-2">Parameters:</h6>
              {#each selectedEndpoint.parameters as param}
                <div class="mb-3">
                  <label for="param-{param.name}" class="form-label">
                    {param.name}
                    {#if param.required}<span class="text-danger">*</span>{/if}
                    {#if param.description}<small class="text-muted ms-1">{param.description}</small
                      >{/if}
                  </label>
                  {#if param.type === 'number'}
                    <input
                      id="param-{param.name}"
                      type="number"
                      class="form-control"
                      bind:value={parameters[param.name]}
                      placeholder={param.example || ''}
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
                      placeholder={param.example || ''}
                      required={param.required}
                    />
                  {/if}
                </div>
              {/each}
            {/if}

            <div class="mt-4">
              <button
                class="btn btn-success"
                on:click={executeRequest}
                disabled={$isLoading || !$token}
              >
                {$isLoading ? 'Executing...' : 'Execute'}
              </button>
              <button class="btn btn-outline-secondary ms-2" on:click={() => showCode('fetch')}>
                Generate fetch()
              </button>
              <button class="btn btn-outline-secondary ms-2" on:click={() => showCode('curl')}>
                Generate curl
              </button>
            </div>
          </div>
        </div>

        <!-- Code Generation -->
        {#if showCodeGeneration}
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5>Code Example</h5>
              <button
                class="btn btn-link btn-sm p-1 text-decoration-none"
                on:click={() => copyToClipboard(generatedCode)}
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
              </button>
            </div>
            <div class="card-body">
              <pre class="bg-light rounded mb-0"><code>{generatedCode}</code></pre>
            </div>
          </div>
        {/if}

        <!-- Response -->
        <Response request={$currentRequest} />
      {:else}
        <div class="card">
          <div class="card-body text-center text-muted py-5">
            <h3>Welcome to FreeFeed API Explorer</h3>
            <p>Select an API endpoint from the sidebar to get started.</p>
            <p class="small">
              This tool helps you explore and test the FreeFeed API. Your token and request history
              are stored locally on your device.
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>

</div>

<!-- Token Modal -->
<div class="modal fade" id="tokenModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Configure API Token</h5>
      </div>
      <div class="modal-body">
        <div class="alert alert-info">
          <strong>Privacy Notice:</strong> Your token is stored locally in your browser's localStorage
          and will not be sent to any third-party servers except when making API requests to the selected
          FreeFeed instance.
        </div>
        <div class="mb-3">
          <label for="token-input" class="form-label">FreeFeed API Token</label>
          <input
            id="token-input"
            type="password"
            class="form-control"
            bind:value={$token}
            placeholder="Enter your FreeFeed API token..."
          />
        </div>
        <div class="mb-3">
          <label for="instance-select" class="form-label">FreeFeed Instance</label>
          <select id="instance-select" class="form-select" bind:value={$selectedInstance}>
            {#each FREEFEED_INSTANCES as instance}
              <option value={instance}>{instance.name} - {instance.description}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal" disabled={!$token}>
          Save Configuration
        </button>
      </div>
    </div>
  </div>
</div>
