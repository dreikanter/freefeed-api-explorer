<script lang="ts">
  import { tokens, activeTokenId, setActiveToken, removeToken, validationResults, validatingTokenIds, validateToken } from '$lib/stores.js';
  import TokenModal from './TokenModal.svelte';

  let tokenModal: TokenModal;

  function handleValidate(token: Parameters<typeof validateToken>[0]) {
    validateToken(token);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3 class="mb-0">Tokens</h3>
          <button class="btn btn-primary btn-sm" on:click={() => tokenModal.show()}>Create Token</button>
        </div>
        <div class="card-body p-0">
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
                    <th>Title</th>
                    <th>Instance</th>
                    <th>Created</th>
                    <th>Status</th>
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
                      <td>{token.instance.name}</td>
                      <td>{formatDate(token.createdAt)}</td>
                      <td class="validation-status">
                        {#if $validatingTokenIds.has(token.id)}
                          <span class="text-muted"><i class="bi bi-arrow-repeat spin"></i> Validating…</span>
                        {:else if $validationResults[token.id]}
                          {@const result = $validationResults[token.id]}
                          {#if result.status === 'valid'}
                            <span class="text-success" title="Validated at {formatDate(result.validatedAt)}"><i class="bi bi-check-circle-fill"></i> {result.username}</span>
                          {:else if result.status === 'invalid'}
                            <span class="text-danger" title="Validated at {formatDate(result.validatedAt)}"><i class="bi bi-x-circle-fill"></i> Invalid</span>
                          {:else}
                            <span class="text-warning" title={result.message}><i class="bi bi-exclamation-triangle-fill"></i> Error</span>
                          {/if}
                        {:else}
                          <button
                            class="btn btn-outline-secondary btn-sm"
                            on:click|stopPropagation={() => handleValidate(token)}
                            title="Validate token"
                          >Validate</button>
                        {/if}
                      </td>
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

  .spin {
    display: inline-block;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .validation-status {
    white-space: nowrap;
  }
</style>
