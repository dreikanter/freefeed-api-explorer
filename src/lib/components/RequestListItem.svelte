<script lang="ts">
  import type { ApiEndpoint } from '../types.js';
  import MethodBadge from './MethodBadge.svelte';

  export let endpoint: ApiEndpoint;
  export let isSelected: boolean = false;
  export let onClick: () => void;
  export let layout: 'simple' | 'detailed' = 'simple';
  export let methodBadgePathClass: string = '';
</script>

<button class="list-group-item list-group-item-action {isSelected ? 'active' : ''}" on:click={onClick}>
  {#if layout === 'simple'}
    <!-- Simple vertical layout for endpoints -->
    <h6 class="fw-normal">
      <strong>
        <MethodBadge {endpoint} pathClass={methodBadgePathClass} />
      </strong>
    </h6>
    <p class="mb-1 small">{endpoint.description}</p>
    <slot name="footer" />
  {:else}
    <!-- Detailed flex layout for requests -->
    <div class="d-flex w-100 justify-content-between align-items-start">
      <div class="flex-grow-1">
        <h6 class="mb-1">
          <MethodBadge {endpoint} pathClass={methodBadgePathClass} />
        </h6>
        <p class="mb-1 small text-muted">{endpoint.description}</p>
        <slot name="subtitle" />
      </div>
      <div class="text-end">
        <slot name="side-content" />
      </div>
    </div>
  {/if}
</button>
