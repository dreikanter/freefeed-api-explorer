<script lang="ts">
  import type { ApiEndpoint } from '../types.js';
  import type { Snippet } from 'svelte';

  let {
    endpoint,
    isSelected = false,
    onClick,
    sideContent,
  }: {
    endpoint: ApiEndpoint;
    isSelected?: boolean;
    onClick: () => void;
    sideContent?: Snippet;
  } = $props();

  let selectedTextClass = $derived(isSelected ? 'text-light' : '');
</script>

<button class="list-group-item list-group-item-action {isSelected ? 'active' : ''}" onclick={onClick}>
  <div class="d-flex w-100 justify-content-between align-items-start">
    <div class="flex-grow-1">
      <p class="mb-1 font-monospace small {selectedTextClass}">
        <strong>{endpoint.method}</strong>
        {endpoint.path}
      </p>
      <p class="mb-1 small {selectedTextClass}">{endpoint.description}</p>
      <p class="mb-0">
        {#each endpoint.scopes as s}<span class="badge bg-info me-1">{s}</span>{/each}
      </p>
    </div>
    <div class="text-end {selectedTextClass}">
      {#if sideContent}{@render sideContent()}{/if}
    </div>
  </div>
</button>

<style>
  /* Override all text colors when item is active/selected */
  .list-group-item.active .text-muted,
  .list-group-item.active .text-secondary {
    color: rgba(255, 255, 255, 0.9) !important;
  }

  /* Ensure all text inside active items has good contrast */
  .list-group-item.active *:not(.badge) {
    color: rgba(255, 255, 255, 0.9) !important;
  }
</style>
