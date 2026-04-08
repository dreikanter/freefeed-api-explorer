<script lang="ts">
  import NavigationBar from '$lib/components/NavigationBar.svelte';
  import TokensPage from '$lib/components/TokensPage.svelte';
</script>

<svelte:head>
  <title>Tokens - FreeFeed API Explorer</title>
</svelte:head>

<NavigationBar currentPage="tokens" />

<TokensPage />
