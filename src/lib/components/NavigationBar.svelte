<script lang="ts">
  import { env } from '$env/dynamic/public';

  export let currentPage: 'home' | 'history' | 'requests' | 'tokens' | 'about' = 'home';

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
      <a href="/requests" class="nav-link text-light ms-3" class:nav-link-active={currentPage === 'requests'}>Requests</a>
      <a href="/history" class="nav-link text-light ms-3" class:nav-link-active={currentPage === 'history'}>History</a>
      <a href="/tokens" class="nav-link text-light ms-3" class:nav-link-active={currentPage === 'tokens'}>Tokens</a>
      <a href="/about" class="nav-link text-light ms-3" class:nav-link-active={currentPage === 'about'}>About</a>
    </div>
  </div>
</nav>

<style>
  .nav-link-active {
    border-bottom: 2px solid white;
  }
</style>
