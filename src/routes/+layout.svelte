<script lang="ts">
  import SidebarOffcanvas from '$lib/components/SidebarOffcanvas.svelte';

  let { children } = $props();
</script>

<main>
  {@render children()}
</main>

<SidebarOffcanvas />
