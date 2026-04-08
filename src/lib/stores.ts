import { writable, derived } from 'svelte/store';
import type { FreeFeedInstance, ApiRequest, SavedToken, ValidationResult } from './types.js';
import { FREEFEED_INSTANCES } from './api-endpoints.js';

function createLocalStorageStore<T>(key: string, defaultValue: T) {
  let initial = defaultValue;

  // Only access localStorage on client-side
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        initial = JSON.parse(storedValue);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }

  const store = writable<T>(initial);

  // Only subscribe to localStorage updates on client-side
  if (typeof window !== 'undefined') {
    store.subscribe((value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error writing to localStorage key "${key}":`, error);
      }
    });
  }

  return store;
}

// --- Multi-token stores ---

export const tokens = createLocalStorageStore<SavedToken[]>('freefeed-tokens', []);
export const activeTokenId = createLocalStorageStore<string>('freefeed-active-token-id', '');

export const activeToken = derived(
  [tokens, activeTokenId],
  ([$tokens, $activeTokenId]) => $tokens.find((t) => t.id === $activeTokenId) ?? null
);

export const selectedInstance = createLocalStorageStore<FreeFeedInstance>('freefeed-instance', FREEFEED_INSTANCES[0]);

// Auto-sync selectedInstance when active token changes
activeToken.subscribe((token) => {
  if (token) {
    selectedInstance.set(token.instance);
  }
});

// Auto-select first available token when none is active
tokens.subscribe(($tokens) => {
  if ($tokens.length > 0) {
    let currentActiveId: string = '';
    const unsub = activeTokenId.subscribe((id) => (currentActiveId = id));
    unsub();
    const hasActive = $tokens.some((t) => t.id === currentActiveId);
    if (!hasActive) {
      activeTokenId.set($tokens[0].id);
    }
  }
});
export const requestHistory = createLocalStorageStore<ApiRequest[]>('freefeed-history', []);

export const currentRequest = createLocalStorageStore<ApiRequest | null>('freefeed-current-request', null);
export const isLoading = writable(false);

export const searchQuery = createLocalStorageStore('freefeed-search-query', '');
export const selectedScope = createLocalStorageStore('freefeed-selected-scope', '');

export function removeToken(id: string) {
  tokens.update((list) => list.filter((t) => t.id !== id));
  activeTokenId.update((current) => (current === id ? '' : current));
}

export function setActiveToken(id: string) {
  activeTokenId.set(id);
}

export function clearHistory() {
  requestHistory.set([]);
  currentRequest.set(null);
}

export function addToHistory(request: ApiRequest) {
  requestHistory.update((history) => [request, ...history.slice(0, 49)]);
}

// --- Token validation ---

export const validationResults = writable<Record<string, ValidationResult>>({});
export const validatingTokenIds = writable<Set<string>>(new Set());

export async function validateToken(token: SavedToken): Promise<void> {
  validatingTokenIds.update((ids) => new Set(ids).add(token.id));

  try {
    const url = `${token.instance.url}/v2/users/whoami`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.value}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const username = data?.users?.username ?? 'unknown';
      validationResults.update((results) => ({
        ...results,
        [token.id]: { status: 'valid', username, validatedAt: Date.now() },
      }));
    } else {
      validationResults.update((results) => ({
        ...results,
        [token.id]: { status: 'invalid', validatedAt: Date.now() },
      }));
    }
  } catch {
    validationResults.update((results) => ({
      ...results,
      [token.id]: { status: 'error', message: 'Connection failed', validatedAt: Date.now() },
    }));
  } finally {
    validatingTokenIds.update((ids) => {
      const next = new Set(ids);
      next.delete(token.id);
      return next;
    });
  }
}
