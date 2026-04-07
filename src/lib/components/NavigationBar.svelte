<script lang="ts">
  import { FREEFEED_INSTANCES } from '$lib/api-endpoints.js';
  import { selectedInstance, clearToken } from '$lib/stores.js';
  import { env } from '$env/dynamic/public';

  export let currentPage: 'home' | 'history' | 'requests' | 'about' = 'home';

  const environment = env.PUBLIC_ENVIRONMENT || 'development';
</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container-fluid">
    <div class="d-flex align-items-center">
      <button
        class="btn text-light show-below-md me-2 p-1"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
        aria-label="Browse endpoints"
      >
        <i class="bi bi-list fs-4"></i>
      </button>
      <a href="/" class="navbar-brand mb-0 me-0 h1 text-decoration-none">FreeFeed API Explorer</a>
      {#if environment === 'staging'}
        <span class="badge bg-warning text-dark ms-2">STAGING</span>
      {/if}
      <a href="/requests" class="nav-link text-light ms-3 {currentPage === 'requests' ? 'active fw-bold' : ''}">Requests</a>
      <a href="/history" class="nav-link text-light ms-3 {currentPage === 'history' ? 'active fw-bold' : ''}">History</a>
      <a href="/about" class="nav-link text-light ms-3 {currentPage === 'about' ? 'active fw-bold' : ''}">?</a>
    </div>
    <div class="navbar-nav ms-auto">
      <div class="dropdown">
        <button class="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
          {$selectedInstance.name}
        </button>
        <ul class="dropdown-menu">
          {#each FREEFEED_INSTANCES as instance}
            <li>
              <button class="dropdown-item" on:click={() => ($selectedInstance = instance)}>
                {instance.name}
              </button>
            </li>
          {/each}
        </ul>
      </div>
      <button class="btn btn-outline-light btn-sm ms-2" on:click={clearToken}>Reset Token</button>
    </div>
  </div>
</nav>
