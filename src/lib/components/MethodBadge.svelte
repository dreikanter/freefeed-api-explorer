<script lang="ts">
  import type { ApiEndpoint } from '../types.js';

  export let endpoint: ApiEndpoint;
  export let pathClass: string = '';
  export let badgeClass: string = '';
</script>

<span
  class="badge bg-{endpoint.method === 'GET'
    ? 'success'
    : endpoint.method === 'POST'
      ? 'primary'
      : endpoint.method === 'PUT'
        ? 'warning'
        : endpoint.method === 'DELETE'
          ? 'danger'
          : 'secondary'} {badgeClass}"
>
  {endpoint.method}
</span>
{#if pathClass}
  <span class="{pathClass}">{endpoint.path}</span>
{:else}
  {endpoint.path}
{/if}