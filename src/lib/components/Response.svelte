<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import hljs from 'highlight.js/lib/core';
  import json from 'highlight.js/lib/languages/json';
  import 'highlight.js/styles/github.css';
  import 'highlightjs-copy/dist/highlightjs-copy.min.css';
  import CopyButtonPlugin from 'highlightjs-copy';
  import type { ApiRequest } from '../types.js';
  import { getRelativeTime } from '../utils.js';

  export let request: ApiRequest | null = null;

  onMount(() => {
    hljs.registerLanguage('json', json);
    hljs.addPlugin(new CopyButtonPlugin({
      autohide: false
    }));
  });

  afterUpdate(() => {
    hljs.highlightAll();
  });

  function formatJson(jsonString: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  }

  function highlightJson(jsonString: string): string {
    const formatted = formatJson(jsonString);
    return hljs.highlight(formatted, { language: 'json' }).value;
  }

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
        <span
          class="badge bg-{request.response.status < 300
            ? 'success'
            : request.response.status < 400
              ? 'warning'
              : 'danger'}"
        >
          {request.response.status}
        </span>
        <span class="text-muted ms-2">
          {getStatusText(request.response.status)}
        </span>
      </div>

      <div class="mb-3">
        <strong>Headers:</strong>
        <pre class="bg-light m-0 p-2 rounded small hljs"><code>{@html highlightJson(
              JSON.stringify(request.response.headers, null, 2)
            )}</code></pre>
      </div>

      <div class="mb-3">
        <strong>Body:</strong>
        <pre class="bg-light m-0 p-2 rounded hljs"><code>{@html highlightJson(request.response.body)}</code></pre>
      </div>
    </div>
  </div>
{/if}
