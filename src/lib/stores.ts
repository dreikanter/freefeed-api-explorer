import { writable } from 'svelte/store';
import type { FreeFeedInstance, ApiRequest, AppSettings } from './types.js';
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

export const token = createLocalStorageStore('freefeed-token', '');
export const selectedInstance = createLocalStorageStore<FreeFeedInstance>('freefeed-instance', FREEFEED_INSTANCES[0]);
export const requestHistory = createLocalStorageStore<ApiRequest[]>('freefeed-history', []);

export const currentRequest = createLocalStorageStore<ApiRequest | null>('freefeed-current-request', null);
export const isLoading = writable(false);

export function clearToken() {
  token.set('');
}

export function clearHistory() {
  requestHistory.set([]);
  currentRequest.set(null);
}

export function addToHistory(request: ApiRequest) {
  requestHistory.update((history) => [request, ...history.slice(0, 49)]);
}
