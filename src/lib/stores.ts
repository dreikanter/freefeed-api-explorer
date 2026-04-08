import { writable, derived } from 'svelte/store';
import type { FreeFeedInstance, ApiRequest, SavedToken } from './types.js';
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
