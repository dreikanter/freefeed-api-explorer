<script lang="ts">
  import { JsonView } from '@zerodevx/svelte-json-view';
  import type { ApiRequest } from '../types.js';
  import { getRelativeTime } from '../utils.js';
  import ResponseStatus from './ResponseStatus.svelte';

  export let request: ApiRequest | null = null;

  $: parsedResponseBody = (() => {
    try {
      return JSON.parse(request?.response?.body ?? '');
    } catch {
      return null;
    }
  })();


  function getStatusText(status: number): string {
    if (status === 0) return 'Network Error';
    if (status >= 200 && status < 300) {
      const statusTexts: Record<number, string> = {
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        204: 'No Content',
      };
      return statusTexts[status] || 'Success';
    }
    if (status >= 300 && status < 400) {
      const statusTexts: Record<number, string> = {
        301: 'Moved Permanently',
        302: 'Found',
        304: 'Not Modified',
      };
      return statusTexts[status] || 'Redirect';
    }
    if (status >= 400 && status < 500) {
      const statusTexts: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
      };
      return statusTexts[status] || 'Client Error';
    }
    if (status >= 500) {
      const statusTexts: Record<number, string> = {
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
      };
      return statusTexts[status] || 'Server Error';
    }
    return 'Unknown';
  }
</script>

{#if request?.response}
  <div class="card">
    <h5 class="card-header">
      Response <span class="text-muted">
        (received {getRelativeTime(request.response.timestamp)})
      </span>
    </h5>
    <div class="card-body">
      <div class="mb-3">
        <strong>Status:</strong>
        <ResponseStatus status={request.response.status} />
        <span class="text-muted">- {getStatusText(request.response.status)}</span>
      </div>

      <div class="mb-3">
        <p class="mb-3"><strong>Headers:</strong></p>
        <ul class="list-unstyled ps-4">
          {#each Object.entries(request.response.headers) as [key, value]}
            <li class="mb-1">
              <code class="text-primary">{key}</code>
              :
              <code class="bg-light px-1">{value}</code>
            </li>
          {/each}
        </ul>
      </div>

      <div class="mb-3">
        <p class="mb-3"><strong>Body:</strong></p>
        {#if parsedResponseBody !== null}
          <div class="json-viewer-wrapper p-2 rounded bg-light">
            <JsonView json={parsedResponseBody} depth={1} />
          </div>
        {:else}
          <pre class="m-0 p-2 rounded"><code>{request.response.body}</code></pre>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .json-viewer-wrapper {
    font-family: var(--bs-font-monospace);
    font-size: 0.875rem;
    overflow-x: auto;
  }
</style>
