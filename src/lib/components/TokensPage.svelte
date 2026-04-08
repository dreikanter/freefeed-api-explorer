<script lang="ts">
  import { tokens, activeTokenId, setActiveToken, removeToken } from '$lib/stores.js';
  import TokenModal from './TokenModal.svelte';

  let tokenModal: TokenModal;

  function maskToken(value: string): string {
    if (value.length <= 8) return '****';
    return value.slice(0, 4) + '****' + value.slice(-4);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div class="container mb-4">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3 class="mb-0">Tokens</h3>
          <button class="btn btn-primary btn-sm" on:click={() => tokenModal.show()}>Create Token</button>
        </div>
        <div class="card-body">
          {#if $tokens.length === 0}
            <p class="text-center text-muted py-4 mb-0">
              No tokens saved yet. Click <strong>Create Token</strong> to get started.
            </p>
          {:else}
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th></th>
                    <th>Label</th>
                    <th>Token</th>
                    <th>Instance</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {#each $tokens as token (token.id)}
                    <tr
                      class="cursor-pointer {token.id === $activeTokenId ? 'table-primary' : ''}"
                      on:click={() => setActiveToken(token.id)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && setActiveToken(token.id)}
                    >
                      <td class="text-center" style="width: 2rem">
                        {#if token.id === $activeTokenId}
                          <i class="bi bi-check-circle-fill text-primary"></i>
                        {:else}
                          <i class="bi bi-circle text-muted"></i>
                        {/if}
                      </td>
                      <td>{token.label}</td>
                      <td><code>{maskToken(token.value)}</code></td>
                      <td>{token.instance.name}</td>
                      <td>{formatDate(token.createdAt)}</td>
                      <td>
                        <button
                          class="btn btn-outline-danger btn-sm"
                          on:click|stopPropagation={() => removeToken(token.id)}
                          title="Delete token"
                        >Delete</button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<TokenModal bind:this={tokenModal} />

<style>
  .cursor-pointer {
    cursor: pointer;
  }
</style>
