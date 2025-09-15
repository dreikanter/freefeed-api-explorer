<script lang="ts">
  import type { ApiEndpoint } from '../types.js';

  export let endpoint: ApiEndpoint;
  export let isSelected: boolean = false;
  export let onClick: () => void;

  $: selectedTextClass = isSelected ? 'text-light' : '';
</script>

<button class="list-group-item list-group-item-action {isSelected ? 'active' : ''}" on:click={onClick}>
  <div class="d-flex w-100 justify-content-between align-items-start">
    <div class="flex-grow-1">
      <p class="mb-1 font-monospace small {selectedTextClass}">
        <strong>{endpoint.method}</strong>
        {endpoint.path}
      </p>
      <p class="mb-1 small {selectedTextClass}">{endpoint.description}</p>
      <p class="mb-0"><span class="badge bg-info">{endpoint.scope}</span></p>
    </div>
    <div class="text-end {selectedTextClass}">
      <slot name="side-content" />
    </div>
  </div>
</button>

<style>
  /* Override all text colors when item is active/selected */
  .list-group-item.active .text-muted,
  .list-group-item.active .text-secondary,
  .list-group-item.active small,
  .list-group-item.active .small {
    color: rgba(255, 255, 255, 0.9) !important;
  }

  /* Ensure all text inside active items has good contrast */
  .list-group-item.active *:not(.badge) {
    color: rgba(255, 255, 255, 0.9) !important;
  }

  /* Specifically target nested elements */
  .list-group-item.active div small,
  .list-group-item.active [slot='side-content'] * {
    color: rgba(255, 255, 255, 0.9) !important;
  }
</style>
