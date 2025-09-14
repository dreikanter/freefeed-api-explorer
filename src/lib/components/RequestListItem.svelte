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
        <MethodBadge {endpoint} pathClass={methodBadgePathClass} />
      </h6>
      <p class="mb-1 small text-muted">{endpoint.description}</p>
      <slot />
    </div>
    <div class="text-end">
      <slot name="side-content" />
    </div>
  </div>
</button>
