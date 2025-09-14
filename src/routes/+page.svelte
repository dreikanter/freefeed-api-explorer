<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { ApiEndpoint, ApiRequest, ApiResponse } from '$lib/types.js';
  import { API_ENDPOINTS, FREEFEED_INSTANCES } from '$lib/api-endpoints.js';
  import { token, selectedInstance, currentRequest, isLoading, addToHistory, requestHistory } from '$lib/stores.js';
  import Response from '$lib/components/Response.svelte';
  import NavigationBar from '$lib/components/NavigationBar.svelte';
  import RequestListItem from '$lib/components/RequestListItem.svelte';
  import { initHighlight, hljs } from '$lib/highlight.js';
  import 'highlight.js/styles/github.css';
  import 'highlightjs-copy/dist/highlightjs-copy.min.css';

  let searchQuery = '';
  let selectedScope = '';
  let filteredEndpoints: ApiEndpoint[] = API_ENDPOINTS;
  let selectedEndpoint: ApiEndpoint | null = null;
  let parameters: Record<string, string> = {};
  let showCodeGeneration = false;
  let generatedCode = '';
  let codeLanguage = 'javascript';

  // Find most recent response for the currently selected endpoint
  $: endpointResponse = selectedEndpoint
    ? $requestHistory.find(
        (req) => req.endpoint.method === selectedEndpoint.method && req.endpoint.path === selectedEndpoint.path
      )
    : null;

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
      const found = API_ENDPOINTS.find((ep) => ep.method === method && ep.path === path);
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
    codeLanguage = type === 'fetch' ? 'javascript' : 'bash';
    if (showCodeGeneration && generatedCode === newCode) {
      showCodeGeneration = false;
    } else {
      generatedCode = newCode;
      showCodeGeneration = true;
    }
  }

  function showCodeFromRequest(type: 'fetch' | 'curl') {
    if (!$currentRequest) return;

    // Temporarily set selectedEndpoint and parameters from stored request
    const tempEndpoint = $currentRequest.endpoint;
    const tempParameters = $currentRequest.parameters;

    // Store current values
    const originalEndpoint = selectedEndpoint;
    const originalParameters = parameters;

    // Set temporary values
    selectedEndpoint = tempEndpoint;
    parameters = tempParameters;

    // Generate code
    const newCode = type === 'fetch' ? generateFetchCode() : generateCurlCode();
    codeLanguage = type === 'fetch' ? 'javascript' : 'bash';

    // Restore original values
    selectedEndpoint = originalEndpoint;
    parameters = originalParameters;

    if (showCodeGeneration && generatedCode === newCode) {
      showCodeGeneration = false;
    } else {
      generatedCode = newCode;
      showCodeGeneration = true;
    }
  }

  async function executeStoredRequest() {
    if (!$currentRequest || !$token || !$selectedInstance) return;

    // Temporarily set selectedEndpoint and parameters from stored request
    const tempEndpoint = $currentRequest.endpoint;
    const tempParameters = $currentRequest.parameters;

    // Store current values
    const originalEndpoint = selectedEndpoint;
    const originalParameters = parameters;

    // Set temporary values
    selectedEndpoint = tempEndpoint;
    parameters = tempParameters;

    // Execute the request
    await executeRequest();

    // Restore original values (but keep the new response)
    selectedEndpoint = originalEndpoint;
    parameters = originalParameters;
  }

  onMount(() => {
    initHighlight();

    if (!$token) {
      // @ts-ignore - Bootstrap is loaded via CDN
      const modal = new window.bootstrap.Modal(document.getElementById('tokenModal'));
      modal.show();
    }
  });

  function highlightCode(code: string, language: string): string {
    return hljs.highlight(code, { language }).value;
  }
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
            <input type="text" class="form-control mb-2" placeholder="Search endpoints..." bind:value={searchQuery} />
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
              <RequestListItem
                {endpoint}
                isSelected={selectedEndpoint === endpoint}
                onClick={() => selectEndpoint(endpoint)}
                methodBadgePathClass="font-monospace"
              >
                <small class="text-muted">{endpoint.scope}</small>
              </RequestListItem>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="col-md-8">
      {#if selectedEndpoint}
        <div class="card mb-4">
          <h5 class="card-header">
            {selectedEndpoint.method}
            {selectedEndpoint.path}
          </h5>
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
              <button class="btn btn-success" on:click={executeRequest} disabled={$isLoading || !$token}>
                {$isLoading ? 'Executing...' : 'Execute'}
              </button>
              <button class="btn btn-outline-secondary ms-2" on:click={() => showCode('fetch')}>
                Generate fetch call
              </button>
              <button class="btn btn-outline-secondary ms-2" on:click={() => showCode('curl')}>Generate curl command</button>
            </div>
          </div>
        </div>

        <!-- Code Generation -->
        {#if showCodeGeneration}
          <div class="card mb-4">
            <h5 class="card-header">Code Example</h5>
            <div class="card-body">
              <pre class="m-0 p-2 rounded small hljs"><code>{@html highlightCode(
                    generatedCode,
                    codeLanguage
                  )}</code></pre>
            </div>
          </div>
        {/if}

        <!-- Response -->
        {#if endpointResponse}
          <Response request={endpointResponse} />
        {/if}
      {:else if !endpointResponse && !$currentRequest}
        <div class="card">
          <div class="card-body text-center text-muted py-5">
            <h3>Welcome to FreeFeed API Explorer</h3>
            <p>Select an API endpoint from the sidebar to get started.</p>
            <p class="small">
              This tool helps you explore and test the FreeFeed API. Your token and request history are stored locally
              on your device.
            </p>
          </div>
        </div>
      {/if}

      <!-- Show response and code generation when no endpoint selected but have current request -->
      {#if !selectedEndpoint && $currentRequest}
        <div class="card mb-4">
          <h5 class="card-header">
            {$currentRequest.endpoint.method}
            {$currentRequest.endpoint.path}
          </h5>
          <div class="card-body">
            <p class="card-text">{$currentRequest.endpoint.description}</p>
            <p>
              Scope: <span class="badge bg-info">{$currentRequest.endpoint.scope}</span>
            </p>

            <div class="mt-4">
              <button class="btn btn-success me-2" on:click={executeStoredRequest} disabled={$isLoading || !$token}>
                {$isLoading ? 'Executing...' : 'Execute Again'}
              </button>
              <button class="btn btn-outline-secondary ms-2" on:click={() => showCodeFromRequest('fetch')}>
                Generate fetch()
              </button>
              <button class="btn btn-outline-secondary ms-2" on:click={() => showCodeFromRequest('curl')}>
                Generate curl
              </button>
            </div>
          </div>
        </div>

        <!-- Code Generation for stored request -->
        {#if showCodeGeneration}
          <div class="card mb-4">
            <h5 class="card-header">Code Example</h5>
            <div class="card-body">
              <pre class="m-0 p-2 rounded small hljs"><code>{@html highlightCode(
                    generatedCode,
                    codeLanguage
                  )}</code></pre>
            </div>
          </div>
        {/if}
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
          <strong>Privacy Notice:</strong>
          Your token is stored locally in your browser's localStorage and will not be sent to any third-party servers except
          when making API requests to the selected FreeFeed instance.
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
              <option value={instance}>
                {instance.name} - {instance.description}
              </option>
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
