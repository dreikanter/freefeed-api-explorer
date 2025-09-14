<script lang="ts">
  import type { ApiEndpoint } from '../types.js';
  import MethodBadge from './MethodBadge.svelte';

  export let endpoint: ApiEndpoint;
  export let isSelected: boolean = false;
  export let onClick: () => void;
  export let methodBadgePathClass: string = '';
</script>

<button class="list-group-item list-group-item-action {isSelected ? 'active' : ''}" on:click={onClick}>
  <div class="d-flex w-100 justify-content-between align-items-start">
    <div class="flex-grow-1">
      <h6 class="mb-1">
        <MethodBadge method={endpoint.method} />
        {#if methodBadgePathClass}
          <span class="{methodBadgePathClass} {isSelected ? 'text-light' : ''}">{endpoint.path}</span>
        {:else}
          <span class={isSelected ? 'text-light' : ''}>{endpoint.path}</span>
        {/if}
      </h6>
      <p class="mb-1 small {isSelected ? 'text-light' : 'text-muted'}">{endpoint.description}</p>
      <div class={isSelected ? 'text-light' : ''}>
        <slot />
      </div>
    </div>
    <div class="text-end {isSelected ? 'text-light' : ''}">
      <slot name="side-content" />
    </div>
  </div>
</button>
