<script lang="ts">
  import { FREEFEED_INSTANCES } from '$lib/api-endpoints.js';
  import { tokens, activeTokenId, selectedInstance } from '$lib/stores.js';

  let tokenInput = '';

  export function show() {
    // @ts-ignore - Bootstrap is loaded via CDN
    const modal = new window.bootstrap.Modal(document.getElementById('tokenModal'));
    modal.show();
  }

  function saveToken() {
    if (!tokenInput) return;
    const newToken = {
      id: crypto.randomUUID(),
      label: 'API token',
      value: tokenInput,
      instance: $selectedInstance,
      createdAt: Date.now(),
    };
    tokens.update((list) => [...list, newToken]);
    activeTokenId.set(newToken.id);
    tokenInput = '';
  }
</script>

<div class="modal fade" id="tokenModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Create Token</h5>
      </div>
      <div class="modal-body">
        <div class="alert alert-info">
          <strong>Privacy Notice:</strong>
          Your token is stored locally in your browser's localStorage and will not be sent to any third-party servers except
          when making API requests to the selected FreeFeed instance.
        </div>
        <div class="mb-3">
          <label for="token-input" class="form-label">FreeFeed API Token</label>
          <input
            id="token-input"
            type="password"
            class="form-control"
            bind:value={tokenInput}
            placeholder="Enter your FreeFeed API token..."
          />
        </div>
        <div class="mb-3">
          <label for="instance-select" class="form-label">FreeFeed Instance</label>
          <select id="instance-select" class="form-select" bind:value={$selectedInstance}>
            {#each FREEFEED_INSTANCES as instance}
              <option value={instance}>
                {instance.name} - {instance.description}
              </option>
            {/each}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal" disabled={!tokenInput} on:click={saveToken}>
          Save Configuration
        </button>
      </div>
    </div>
  </div>
</div>
