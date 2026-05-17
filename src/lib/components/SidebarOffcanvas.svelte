<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { ApiEndpoint } from '$lib/types.js';
  import { API_ENDPOINTS } from '$lib/api-endpoints.js';
  import { searchQuery, selectedScope } from '$lib/stores.js';
  import { endpointToId, idToEndpoint } from '$lib/utils.js';
  import RequestListItem from './RequestListItem.svelte';

  const navLinks = [
    { href: '/requests', label: 'Requests', icon: 'bi-send' },
    { href: '/history', label: 'History', icon: 'bi-clock-history' },
    { href: '/tokens', label: 'Tokens', icon: 'bi-key' },
    { href: '/about', label: 'About', icon: 'bi-info-circle' },
  ];

  const scopes = [...new Set(API_ENDPOINTS.flatMap((e) => e.scopes))].sort();

  let currentPath = $derived($page.url.pathname);

  function isActivePath(href: string): boolean {
    if (href === '/requests') return currentPath === '/' || currentPath === '/requests';
    return currentPath === href;
  }

  let selectedEndpoint = $derived.by((): ApiEndpoint | null => {
    if (currentPath !== '/' && currentPath !== '/requests') return null;
    const endpointParam = $page.url.searchParams.get('endpoint');
    if (!endpointParam) return null;
    let found = idToEndpoint(endpointParam, API_ENDPOINTS);
    if (!found && endpointParam.includes(':')) {
      const [method, path] = endpointParam.split(':', 2);
      found = API_ENDPOINTS.find((ep) => ep.method === method && ep.path === path) || null;
    }
    return found;
  });

  let filteredEndpoints = $derived(
    API_ENDPOINTS.filter((endpoint) => {
      const matchesSearch =
        !$searchQuery ||
        endpoint.path.toLowerCase().includes($searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes($searchQuery.toLowerCase());
      const matchesScope = !$selectedScope || endpoint.scopes.includes($selectedScope);
      return matchesSearch && matchesScope;
    })
  );

  function closeOffcanvas() {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('sidebarOffcanvas');
    if (!el) return;
    // @ts-expect-error - Bootstrap is loaded via CDN
    const offcanvas = window.bootstrap?.Offcanvas.getInstance(el);
    offcanvas?.hide();
  }

  async function selectEndpoint(endpoint: ApiEndpoint) {
    const id = endpointToId(endpoint);
    if (currentPath === '/' || currentPath === '/requests') {
      const url = new URL($page.url);
      url.searchParams.set('endpoint', id);
      await goto(url.toString(), { replaceState: true });
    } else {
      await goto(`/requests?endpoint=${id}`);
    }
    closeOffcanvas();
  }
</script>

<div
  class="offcanvas offcanvas-start sidebar-offcanvas"
  tabindex="-1"
  id="sidebarOffcanvas"
  aria-labelledby="sidebarOffcanvasLabel"
>
  <h5 id="sidebarOffcanvasLabel" class="visually-hidden">Navigation and API endpoints</h5>
  <div class="offcanvas-body p-0">
    <!-- Page navigation -->
    <div class="list-group list-group-flush drawer-nav">
      {#each navLinks as link}
        <a
          href={link.href}
          class="list-group-item list-group-item-action"
          class:active={isActivePath(link.href)}
          onclick={closeOffcanvas}
        >
          <i class="bi {link.icon} me-2"></i>
          {link.label}
        </a>
      {/each}
    </div>

    <!-- API endpoints search + list -->
    <div class="p-3 border-top">
      <input
        type="text"
        class="form-control mb-2"
        placeholder="Search endpoints..."
        bind:value={$searchQuery}
      />
      <select class="form-select" bind:value={$selectedScope}>
        <option value="">All Scopes</option>
        {#each scopes as scope}
          <option value={scope}>{scope}</option>
        {/each}
      </select>
    </div>
    <div class="list-group list-group-flush border-top">
      {#each filteredEndpoints as endpoint}
        <RequestListItem
          {endpoint}
          isSelected={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method}
          onClick={() => selectEndpoint(endpoint)}
        />
      {/each}
    </div>
  </div>
</div>

<style>
  /* Page-nav active item: transparent + bold so it doesn't clash with the
     primary-blue navbar above the drawer. */
  .drawer-nav :global(.list-group-item.active) {
    background-color: transparent;
    color: var(--bs-body-color);
    border-color: var(--bs-border-color);
    font-weight: 600;
  }
</style>
