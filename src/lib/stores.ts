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

function migrateTokens(): SavedToken[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const legacy = localStorage.getItem('freefeed-token');
    if (legacy !== null) {
      const value = JSON.parse(legacy) as string;
      if (value) {
        // Read the instance that was stored alongside the legacy token
        let instance = FREEFEED_INSTANCES[0];
        const storedInstance = localStorage.getItem('freefeed-instance');
        if (storedInstance) {
          try {
            instance = JSON.parse(storedInstance) as FreeFeedInstance;
          } catch { /* keep default */ }
        }

        const migrated: SavedToken = {
          id: crypto.randomUUID(),
          label: 'Migrated token',
          value,
          instance,
          createdAt: Date.now(),
        };
        return [migrated];
      }
    }
  } catch { /* ignore parse errors */ }
  return [];
}

function initTokens(): { tokens: SavedToken[]; activeTokenId: string } {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { tokens: [], activeTokenId: '' };
  }

  // Check for existing multi-token data first
  const stored = localStorage.getItem('freefeed-tokens');
  if (stored !== null) {
    try {
      const tokens = JSON.parse(stored) as SavedToken[];
      const activeId = JSON.parse(localStorage.getItem('freefeed-active-token-id') ?? '""') as string;
      return { tokens, activeTokenId: activeId };
    } catch { /* fall through to migration */ }
  }

  // Migrate from legacy single-token format
  const migrated = migrateTokens();
  if (migrated.length > 0) {
    // Clean up legacy key after migration
    localStorage.removeItem('freefeed-token');
    return { tokens: migrated, activeTokenId: migrated[0].id };
  }

  return { tokens: [], activeTokenId: '' };
}

const { tokens: initialTokens, activeTokenId: initialActiveId } = initTokens();

export const tokens = createLocalStorageStore<SavedToken[]>('freefeed-tokens', initialTokens);
export const activeTokenId = createLocalStorageStore<string>('freefeed-active-token-id', initialActiveId);

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
