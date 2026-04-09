<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { requestHistory, clearHistory } from '$lib/stores.js';
  import type { ApiRequest } from '$lib/types.js';
  import Response from '$lib/components/Response.svelte';
  import NavigationBar from '$lib/components/NavigationBar.svelte';
  import RequestListItem from '$lib/components/RequestListItem.svelte';
  import ResponseStatus from '$lib/components/ResponseStatus.svelte';
  import { getRelativeTime } from '$lib/utils.js';

  let selectedRequest: ApiRequest | null = $state(null);

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
    goto(url.toString(), { replaceState: true }).finally(() => {
      isNavigating = false;
    });
  }

  function clearSelectedRequest() {
    isNavigating = true;
    const url = new URL($page.url);
    url.searchParams.delete('request');
    goto(url.toString(), { replaceState: true }).finally(() => {
      isNavigating = false;
    });
    selectedRequest = null;
  }

  function generateFullUrl(request: ApiRequest): string {
    let path = request.endpoint.path;

    // Replace path parameters with actual values
    if (request.parameters) {
      for (const [key, value] of Object.entries(request.parameters)) {
        if (path.includes(`:${key}`)) {
          path = path.replace(`:${key}`, encodeURIComponent(value));
        }
      }
    }

    // Construct full URL with instance domain
    const fullUrl = new URL(path, request.instance.url);

    // Add query parameters for GET requests
    if (request.endpoint.method === 'GET' && request.parameters) {
      for (const [key, value] of Object.entries(request.parameters)) {
        if (!request.endpoint.path.includes(`:${key}`) && value) {
          fullUrl.searchParams.set(key, value);
        }
      }
    }

    return fullUrl.toString();
  }

  // Watch for URL changes and update selected request
  $effect(() => {
    if (!isNavigating) {
      const requestId = $page.url.searchParams.get('request');
      if (requestId) {
        const found = $requestHistory.find((req) => req.id === requestId);
        if (found && found.id !== selectedRequest?.id) {
          selectedRequest = found;
        } else if (!found) {
          clearSelectedRequest();
        }
      } else if (!requestId && selectedRequest) {
        selectedRequest = null;
      }
    }
  });
</script>

<svelte:head>
  <title>Request History - FreeFeed API Explorer</title>
</svelte:head>

<NavigationBar currentPage="history" />

<div class="split-layout">
  <!-- Left Sidebar: Request History -->
  <div class="split-sidebar border-end">
    <div class="scrollable-column">
      <div class="p-3 border-bottom d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Request History</h5>
        {#if $requestHistory.length > 0}
          <button class="btn btn-sm text-secondary" onclick={clearHistory} title="Clear History">
            <i class="bi bi-trash"></i>
          </button>
        {/if}
      </div>

      {#if $requestHistory.length === 0}
        <div class="p-3 text-center text-muted">
          <p>No requests yet.</p>
          <a href="/" class="btn btn-primary">Start exploring the API</a>
        </div>
      {:else}
        <div class="list-group list-group-flush">
          {#each $requestHistory as request (request.id)}
            <RequestListItem
              endpoint={request.endpoint}
              isSelected={selectedRequest?.id === request.id}
              onClick={() => selectRequest(request)}
            >
              {#snippet sideContent()}
                {#if request.response}
                  <p class="mb-1">
                    <ResponseStatus status={request.response.status} />
                  </p>
                {/if}
                <p class="mb-0 small">
                  {getRelativeTime(request.timestamp)}
                </p>
              {/snippet}
            </RequestListItem>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Main Content: Request Details -->
  <div class="split-main">
    <div class="scrollable-column px-2 pt-2">
      {#if selectedRequest}
        <!-- Request Info -->
        <div class="card mb-4">
          <h5 class="card-header font-monospace">
            <strong>{selectedRequest.endpoint.method}</strong>
            {generateFullUrl(selectedRequest)}
          </h5>
          <div class="card-body">
            <p>
              <strong>Scope:</strong>
              {#each selectedRequest.endpoint.scopes || [] as s}<span class="badge bg-info me-1">{s}</span>{/each}
            </p>
            <p>
              <strong>Instance:</strong>
              {selectedRequest.instance.name}
            </p>

            <!-- Parameters -->
            {#if Object.keys(selectedRequest.parameters).length > 0}
              <p><strong>Parameters Used:</strong></p>
              <ul class="list-unstyled ps-4">
                {#each Object.entries(selectedRequest.parameters) as [key, value]}
                  <li class="mb-1">
                    <code class="text-primary">{key}</code>
                    :
                    <code class="bg-light px-1">{value}</code>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <!-- Response -->
        <Response request={selectedRequest} />
      {:else}
        <div class="card d-none d-md-block">
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
