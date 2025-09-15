<script lang="ts">
  import NavigationBar from '$lib/components/NavigationBar.svelte';
  import RequestsPage from '$lib/components/RequestsPage.svelte';
</script>

<svelte:head>
  <title>FreeFeed API Explorer</title>
</svelte:head>

<NavigationBar currentPage="requests" />

<RequestsPage />