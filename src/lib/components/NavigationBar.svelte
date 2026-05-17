<script lang="ts">
  import { env } from '$env/dynamic/public';

  let { currentPage = 'home' }: { currentPage?: 'home' | 'history' | 'requests' | 'tokens' | 'about' } = $props();

  const environment = env.PUBLIC_ENVIRONMENT || 'development';

  let navEl: HTMLElement | undefined = $state();

  // Keep --nav-h in sync with the navbar's rendered height so the offcanvas
  // and its backdrop sit precisely below it regardless of font size or zoom.
  $effect(() => {
    if (!navEl) return;
    const update = () => {
      document.documentElement.style.setProperty('--nav-h', `${navEl!.offsetHeight}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(navEl);
    return () => observer.disconnect();
  });
</script>

<nav bind:this={navEl} class="navbar bg-primary site-navbar" data-bs-theme="dark">
  <div class="container-fluid">
    <div class="d-flex align-items-center">
      <button
        class="btn text-light nav-hamburger me-2 p-1"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
        aria-label="Open menu"
      >
        <i class="bi bi-list fs-4"></i>
      </button>
      <a href="/" class="navbar-brand mb-0 me-0 h1 text-decoration-none">FreeFeed API Explorer</a>
      {#if environment === 'staging'}
        <span class="badge bg-warning text-dark ms-2">STAGING</span>
      {/if}
      <div class="navbar-nav nav-inline ms-3 flex-row gap-3">
        <a href="/requests" class="nav-link" class:active={currentPage === 'requests'}>Requests</a>
        <a href="/history" class="nav-link" class:active={currentPage === 'history'}>History</a>
        <a href="/tokens" class="nav-link" class:active={currentPage === 'tokens'}>Tokens</a>
        <a href="/about" class="nav-link" class:active={currentPage === 'about'}>About</a>
      </div>
    </div>
  </div>
</nav>

<style>
  /* Below md: hide inline links (use offcanvas drawer instead). */
  @media (max-width: 767.98px) {
    .nav-inline {
      display: none !important;
    }
  }
  /* md and up: hide the hamburger (links + persistent sidebar are inline). */
  @media (min-width: 768px) {
    .nav-hamburger {
      display: none !important;
    }
  }
</style>
