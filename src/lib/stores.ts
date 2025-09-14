import { writable } from 'svelte/store';
import type { FreeFeedInstance, ApiRequest, AppSettings } from './types.js';
import { FREEFEED_INSTANCES } from './api-endpoints.js';

function createLocalStorageStore<T>(key: string, defaultValue: T) {
	const storedValue = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
	const initial = storedValue ? JSON.parse(storedValue) : defaultValue;

	const store = writable<T>(initial);

	store.subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, JSON.stringify(value));
		}
	});

	return store;
}

export const token = createLocalStorageStore('freefeed-token', '');
export const selectedInstance = createLocalStorageStore<FreeFeedInstance>(
	'freefeed-instance',
	FREEFEED_INSTANCES[0]
);
export const requestHistory = createLocalStorageStore<ApiRequest[]>('freefeed-history', []);

export const currentRequest = writable<ApiRequest | null>(null);
export const isLoading = writable(false);

export function clearToken() {
	token.set('');
}

export function clearHistory() {
	requestHistory.set([]);
}

export function addToHistory(request: ApiRequest) {
	requestHistory.update((history) => [request, ...history.slice(0, 49)]);
}
