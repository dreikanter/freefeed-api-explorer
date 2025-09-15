<script lang="ts">
  import { FREEFEED_INSTANCES } from '$lib/api-endpoints.js';
  import { selectedInstance, clearToken, clearHistory } from '$lib/stores.js';

  export let currentPage: 'home' | 'history' | 'requests' = 'home';
</script>

<nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
  <div class="container-fluid">
    <div class="d-flex align-items-center">
      <a href="/" class="navbar-brand mb-0 h1 text-decoration-none">FreeFeed API Explorer</a>
      <a href="/requests" class="nav-link text-light ms-3 {currentPage === 'requests' ? 'active fw-bold' : ''}">Requests</a>
      <a href="/history" class="nav-link text-light ms-3 {currentPage === 'history' ? 'active fw-bold' : ''}">History</a>
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
      <button class="btn btn-outline-light btn-sm ms-2" on:click={clearHistory}>Clear History</button>
      <button class="btn btn-outline-light btn-sm ms-2" on:click={clearToken}>Reset Token</button>
    </div>
  </div>
</nav>
