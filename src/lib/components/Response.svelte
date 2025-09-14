<script lang="ts">
  import type { ApiRequest } from '../types.js';

  export let request: ApiRequest | null = null;

  function formatJson(jsonString: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  }

  function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  function getStatusText(status: number): string {
    if (status === 0) return 'Network Error';
    if (status >= 200 && status < 300) {
      const statusTexts: Record<number, string> = {
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        204: 'No Content'
      };
      return statusTexts[status] || 'Success';
    }
    if (status >= 300 && status < 400) {
      const statusTexts: Record<number, string> = {
        301: 'Moved Permanently',
        302: 'Found',
        304: 'Not Modified'
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
        429: 'Too Many Requests'
      };
      return statusTexts[status] || 'Client Error';
    }
    if (status >= 500) {
      const statusTexts: Record<number, string> = {
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
      };
      return statusTexts[status] || 'Server Error';
    }
    return 'Unknown';
  }
</script>

{#if request?.response}
  <div class="card">
    <h5 class="card-header">Response <span class="text-muted">(received {getRelativeTime(request.response.timestamp)})</span></h5>
    <div class="card-body">
      <div class="mb-3">
        <strong>Status:</strong>
        <span
          class="badge bg-{request.response.status < 300
            ? 'success'
            : request.response.status < 400
              ? 'warning'
              : 'danger'}"
        >
          {request.response.status}
        </span>
        <span class="text-muted ms-2">{getStatusText(request.response.status)}</span>
      </div>

      <div class="mb-3">
        <strong>Headers:</strong>
        <pre class="bg-light m-0 p-2 rounded small">{JSON.stringify(
            request.response.headers,
            null,
            2
          )}</pre>
      </div>

      <div class="mb-3">
        <strong>Body:</strong>
        <pre class="bg-light m-0 p-2 rounded">{formatJson(
            request.response.body
          )}</pre>
      </div>
    </div>
  </div>
{/if}