import { get } from 'svelte/store';
import { requestHistory, currentRequest, clearHistory } from './stores';
import type { ApiRequest } from './types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('stores', () => {
  beforeEach(() => {
    localStorageMock.clear();
    requestHistory.set([]);
    currentRequest.set(null);
  });

  test('clearHistory clears both request history and current request', () => {
    // Set up some initial state
    const mockRequest: ApiRequest = {
      id: 'test-123',
      timestamp: Date.now(),
      instance: { name: 'Test', url: 'http://test.com', description: 'Test instance' },
      endpoint: { method: 'GET', path: '/test', description: 'Test endpoint', scope: 'public', parameters: [] },
      parameters: {},
    };

    requestHistory.set([mockRequest]);
    currentRequest.set(mockRequest);

    // Verify initial state
    expect(get(requestHistory)).toHaveLength(1);
    expect(get(currentRequest)).toEqual(mockRequest);

    // Clear history
    clearHistory();

    // Verify both stores are cleared
    expect(get(requestHistory)).toHaveLength(0);
    expect(get(currentRequest)).toBeNull();
  });
});
