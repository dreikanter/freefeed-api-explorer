<script lang="ts">
  import { env } from '$env/dynamic/public';

  let { currentPage = 'home' }: { currentPage?: 'home' | 'history' | 'requests' | 'tokens' | 'about' } = $props();

  const environment = env.PUBLIC_ENVIRONMENT || 'development';
</script>

<nav class="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
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
      <div class="navbar-nav ms-3">
        <a href="/requests" class="nav-link" class:active={currentPage === 'requests'}>Requests</a>
        <a href="/history" class="nav-link" class:active={currentPage === 'history'}>History</a>
        <a href="/tokens" class="nav-link" class:active={currentPage === 'tokens'}>Tokens</a>
        <a href="/about" class="nav-link" class:active={currentPage === 'about'}>About</a>
      </div>
    </div>
  </div>
</nav>
