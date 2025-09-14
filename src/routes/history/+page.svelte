<script lang="ts">
  import { requestHistory, clearHistory } from '$lib/stores.js';
  import type { ApiRequest } from '$lib/types.js';

  let selectedRequest: ApiRequest | null = null;

  function selectRequest(request: ApiRequest) {
    selectedRequest = request;
  }

  function formatJson(jsonString: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  }
</script>

<svelte:head>
  <title>Request History - FreeFeed API Explorer</title>
</svelte:head>

<!-- Header -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
  <div class="container-fluid">
    <div class="d-flex align-items-center">
      <a href="/" class="navbar-brand mb-0 h1 text-decoration-none">FreeFeed API Explorer</a>
      <span class="nav-link text-light ms-3 active fw-bold">History</span>
    </div>
  </div>
</nav>

<div class="container-fluid">
  <div class="row">
    <!-- Left Sidebar: Request History -->
    <div class="col-md-4">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Request History</h5>
          <button
            class="btn btn-outline-danger btn-sm"
            on:click={clearHistory}
            disabled={$requestHistory.length === 0}
          >
            Clear All
          </button>
        </div>
        <div class="card-body p-0">
          {#if $requestHistory.length === 0}
            <div class="p-3 text-center text-muted">
              <p>No requests yet.</p>
              <a href="/" class="btn btn-primary">Start exploring the API</a>
            </div>
          {:else}
            <div class="list-group list-group-flush" style="max-height: 70vh; overflow-y: auto;">
              {#each $requestHistory as request}
                <button
                  class="list-group-item list-group-item-action {selectedRequest === request
                    ? 'active'
                    : ''}"
                  on:click={() => selectRequest(request)}
                >
                  <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h6 class="mb-1">
                        <span
                          class="badge bg-{request.endpoint.method === 'GET'
                            ? 'success'
                            : request.endpoint.method === 'POST'
                              ? 'primary'
                              : request.endpoint.method === 'PUT'
                                ? 'warning'
                                : request.endpoint.method === 'DELETE'
                                  ? 'danger'
                                  : 'secondary'}"
                        >
                          {request.endpoint.method}
                        </span>
                        <span class="small ms-1">{request.endpoint.path}</span>
                      </h6>
                      <p class="mb-1 small text-muted">{request.endpoint.description}</p>
                      <small class="text-muted">{request.instance.name}</small>
                    </div>
                    <div class="text-end">
                      {#if request.response}
                        <div class="mb-1">
                          <span
                            class="badge bg-{request.response.status < 300
                              ? 'success'
                              : request.response.status < 400
                                ? 'warning'
                                : 'danger'}"
                          >
                            {request.response.status}
                          </span>
                        </div>
                      {/if}
                      <small class="text-muted">
                        {new Date(request.timestamp).toLocaleDateString()}<br />
                        {new Date(request.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Main Content: Request Details -->
    <div class="col-md-8">
      {#if selectedRequest}
        <!-- Request Info -->
        <div class="card mb-4">
          <h5 class="card-header">
            <span
              class="badge bg-{selectedRequest.endpoint.method === 'GET'
                ? 'success'
                : selectedRequest.endpoint.method === 'POST'
                  ? 'primary'
                  : selectedRequest.endpoint.method === 'PUT'
                    ? 'warning'
                    : selectedRequest.endpoint.method === 'DELETE'
                      ? 'danger'
                      : 'secondary'} me-2"
            >
              {selectedRequest.endpoint.method}
            </span>
            {selectedRequest.endpoint.path}
          </h5>
          <div class="card-body">
            <p class="card-text">{selectedRequest.endpoint.description}</p>
            <div class="row">
              <div class="col-md-6">
                <p><strong>Scope:</strong> <span class="badge bg-info">{selectedRequest.endpoint.scope}</span></p>
                <p><strong>Instance:</strong> {selectedRequest.instance.name}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Timestamp:</strong> {new Date(selectedRequest.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <!-- Parameters -->
            {#if Object.keys(selectedRequest.parameters).length > 0}
              <h6>Parameters Used:</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each Object.entries(selectedRequest.parameters) as [key, value]}
                      <tr>
                        <td><code>{key}</code></td>
                        <td><code>{value}</code></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>

        <!-- Response -->
        {#if selectedRequest.response}
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Response</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <strong>Status:</strong>
                  <span
                    class="badge bg-{selectedRequest.response.status < 300
                      ? 'success'
                      : selectedRequest.response.status < 400
                        ? 'warning'
                        : 'danger'} ms-1"
                  >
                    {selectedRequest.response.status}
                  </span>
                </div>
                <div class="col-md-6">
                  <strong>Response Time:</strong>
                  {new Date(selectedRequest.response.timestamp).toLocaleString()}
                </div>
              </div>

              <div class="mb-3">
                <strong>Headers:</strong>
                <pre class="bg-light p-2 rounded small">{JSON.stringify(
                    selectedRequest.response.headers,
                    null,
                    2
                  )}</pre>
              </div>

              <div class="mb-3">
                <strong>Body:</strong>
                <pre
                  class="bg-light p-3 rounded"
                  style="max-height: 400px; overflow-y: auto;"
                >{formatJson(selectedRequest.response.body)}</pre>
              </div>
            </div>
          </div>
        {:else}
          <div class="card">
            <div class="card-body text-center text-muted">
              <p>No response data available for this request.</p>
            </div>
          </div>
        {/if}
      {:else}
        <div class="card">
          <div class="card-body text-center text-muted py-5">
            <h3>Request History</h3>
            <p>Select a request from the sidebar to view its details.</p>
            {#if $requestHistory.length === 0}
              <p class="small">
                No requests found. <a href="/">Start exploring the API</a> to build your request history.
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>