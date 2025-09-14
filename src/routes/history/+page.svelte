<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { requestHistory } from '$lib/stores.js';
  import type { ApiRequest } from '$lib/types.js';
  import Response from '$lib/components/Response.svelte';
  import NavigationBar from '$lib/components/NavigationBar.svelte';
  import MethodBadge from '$lib/components/MethodBadge.svelte';
  import RequestListItem from '$lib/components/RequestListItem.svelte';
  import { getRelativeTime } from '$lib/utils.js';

  let selectedRequest: ApiRequest | null = null;

  let isNavigating = false;

  function selectRequest(request: ApiRequest) {
    if (isNavigating) {
      return;
    }

    selectedRequest = request;
    isNavigating = true;

    // Update URL with selected request ID
    const url = new URL($page.url);
    url.searchParams.set('request', request.id);
    goto(url.toString(), { replaceState: true }).then(() => {
      isNavigating = false;
    });
  }

  // Watch for URL changes and update selected request
  $: {
    if (!isNavigating) {
      const requestId = $page.url.searchParams.get('request');
      if (requestId && $requestHistory.length > 0) {
        const found = $requestHistory.find((req) => req.id === requestId);
        if (found && found !== selectedRequest) {
          selectedRequest = found;
        } else if (!found && selectedRequest) {
          // Request not found, clear URL parameter
          isNavigating = true;
          const url = new URL($page.url);
          url.searchParams.delete('request');
          goto(url.toString(), { replaceState: true }).then(() => {
            isNavigating = false;
          });
          selectedRequest = null;
        }
      } else if (!requestId && selectedRequest) {
        selectedRequest = null;
      }
    }
  }
</script>

<svelte:head>
  <title>Request History - FreeFeed API Explorer</title>
</svelte:head>

<NavigationBar currentPage="history" />

<div class="container-fluid">
  <div class="row">
    <!-- Left Sidebar: Request History -->
    <div class="col-md-4">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Request History</h5>
        </div>
        <div class="card-body p-0">
          {#if $requestHistory.length === 0}
            <div class="p-3 text-center text-muted">
              <p>No requests yet.</p>
              <a href="/" class="btn btn-primary">Start exploring the API</a>
            </div>
          {:else}
            <div class="list-group list-group-flush">
              {#each $requestHistory as request}
                <RequestListItem
                  endpoint={request.endpoint}
                  isSelected={selectedRequest === request}
                  onClick={() => selectRequest(request)}
                  methodBadgePathClass="small ms-1"
                >
                  <small class="text-muted">
                    {request.instance.name}
                  </small>
                  <div slot="side-content">
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
                      {getRelativeTime(request.timestamp)}
                    </small>
                  </div>
                </RequestListItem>
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
            <MethodBadge method={selectedRequest.endpoint.method} />
            <span class="ms-2">{selectedRequest.endpoint.path}</span>
          </h5>
          <div class="card-body">
            <p class="card-text">{selectedRequest.endpoint.description}</p>
            <div class="row">
              <div class="col-md-6">
                <p>
                  <strong>Scope:</strong>
                  <span class="badge bg-info">{selectedRequest.endpoint.scope}</span>
                </p>
                <p>
                  <strong>Instance:</strong>
                  {selectedRequest.instance.name}
                </p>
              </div>
            </div>

            <!-- Parameters -->
            {#if Object.keys(selectedRequest.parameters).length > 0}
              <h6>Parameters Used:</h6>
              <ul class="list-unstyled">
                {#each Object.entries(selectedRequest.parameters) as [key, value]}
                  <li class="mb-1">
                    <code class="text-primary">{key}</code>: <code class="bg-light px-1">{value}</code>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <!-- Response -->
        <Response request={selectedRequest} />
      {:else}
        <div class="card">
          <div class="card-body text-center text-muted py-5">
            <h3>Request History</h3>
            <p>Select a request from the sidebar to view its details.</p>
            {#if $requestHistory.length === 0}
              <p class="small">
                No requests found. <a href="/">Start exploring the API</a>
                to build your request history.
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
