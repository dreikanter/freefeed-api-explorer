import { getRelativeTime, getStatusInfo, endpointToId, idToEndpoint } from './utils';

describe('getRelativeTime', () => {
  const now = Date.now();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns "Just now" for timestamps less than 1 minute ago', () => {
    const timestamp = now - 30000; // 30 seconds ago
    expect(getRelativeTime(timestamp)).toBe('Just now');
  });

  test('returns minutes ago for timestamps less than 1 hour ago', () => {
    const timestamp = now - 5 * 60000; // 5 minutes ago
    expect(getRelativeTime(timestamp)).toBe('5m ago');
  });

  test('returns hours ago for timestamps less than 24 hours ago', () => {
    const timestamp = now - 3 * 3600000; // 3 hours ago
    expect(getRelativeTime(timestamp)).toBe('3h ago');
  });

  test('returns days ago for timestamps more than 24 hours ago', () => {
    const timestamp = now - 2 * 86400000; // 2 days ago
    expect(getRelativeTime(timestamp)).toBe('2d ago');
  });

  test('handles edge case of exactly 1 minute', () => {
    const timestamp = now - 60000; // exactly 1 minute ago
    expect(getRelativeTime(timestamp)).toBe('1m ago');
  });

  test('handles edge case of exactly 1 hour', () => {
    const timestamp = now - 3600000; // exactly 1 hour ago
    expect(getRelativeTime(timestamp)).toBe('1h ago');
  });

  test('handles edge case of exactly 24 hours', () => {
    const timestamp = now - 86400000; // exactly 24 hours ago
    expect(getRelativeTime(timestamp)).toBe('1d ago');
  });
});

describe('getStatusInfo', () => {
  test('returns success info for 200 status', () => {
    const result = getStatusInfo(200);
    expect(result).toEqual({
      icon: 'check-circle-fill',
      color: 'text-success',
      text: '200'
    });
  });

  test('returns success info for 201 status', () => {
    const result = getStatusInfo(201);
    expect(result).toEqual({
      icon: 'check-circle-fill',
      color: 'text-success',
      text: '201'
    });
  });

  test('returns redirect info for 301 status', () => {
    const result = getStatusInfo(301);
    expect(result).toEqual({
      icon: 'arrow-right-circle-fill',
      color: 'text-warning',
      text: '301'
    });
  });

  test('returns redirect info for 302 status', () => {
    const result = getStatusInfo(302);
    expect(result).toEqual({
      icon: 'arrow-right-circle-fill',
      color: 'text-warning',
      text: '302'
    });
  });

  test('returns error info for 404 status', () => {
    const result = getStatusInfo(404);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: '404'
    });
  });

  test('returns error info for 500 status', () => {
    const result = getStatusInfo(500);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: '500'
    });
  });

  test('returns Error text for 0 status (network error)', () => {
    const result = getStatusInfo(0);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: 'Error'
    });
  });

  test('returns Error text for edge case 100 status (informational codes treated as errors)', () => {
    const result = getStatusInfo(100);
    expect(result).toEqual({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: 'Error'
    });
  });
});

describe('endpointToId', () => {

  const testEndpoints = [
    { method: 'GET', path: '/v4/users/whoami' },
    { method: 'POST', path: '/v1/posts' },
    { method: 'DELETE', path: '/v2/posts/:postId' },
    { method: 'PUT', path: '/v1/users/:userId/subscriptions/:username' },
    { method: 'PATCH', path: '/v2/groups/:groupId' }
  ];

  test('converts GET endpoint to URL-friendly ID', () => {
    const endpoint = { method: 'GET', path: '/v4/users/whoami' };
    expect(endpointToId(endpoint)).toBe('get-v4-users-whoami');
  });

  test('converts POST endpoint to URL-friendly ID', () => {
    const endpoint = { method: 'POST', path: '/v1/posts' };
    expect(endpointToId(endpoint)).toBe('post-v1-posts');
  });

  test('converts DELETE endpoint with parameter to URL-friendly ID', () => {
    const endpoint = { method: 'DELETE', path: '/v2/posts/:postId' };
    expect(endpointToId(endpoint)).toBe('delete-v2-posts--postid');
  });

  test('converts complex endpoint with multiple parameters', () => {
    const endpoint = { method: 'PUT', path: '/v1/users/:userId/subscriptions/:username' };
    expect(endpointToId(endpoint)).toBe('put-v1-users--userid-subscriptions--username');
  });

  test('handles root path', () => {
    const endpoint = { method: 'GET', path: '/' };
    expect(endpointToId(endpoint)).toBe('get-');
  });

  test('idToEndpoint finds endpoint by ID', () => {
    const id = 'get-v4-users-whoami';
    const found = idToEndpoint(id, testEndpoints);
    expect(found).toEqual({ method: 'GET', path: '/v4/users/whoami' });
  });

  test('idToEndpoint finds complex endpoint by ID', () => {
    const id = 'put-v1-users--userid-subscriptions--username';
    const found = idToEndpoint(id, testEndpoints);
    expect(found).toEqual({ method: 'PUT', path: '/v1/users/:userId/subscriptions/:username' });
  });

  test('idToEndpoint returns null for non-existent ID', () => {
    const id = 'nonexistent-endpoint';
    const found = idToEndpoint(id, testEndpoints);
    expect(found).toBeNull();
  });

  test('round-trip conversion works correctly', () => {
    testEndpoints.forEach(endpoint => {
      const id = endpointToId(endpoint);
      const foundEndpoint = idToEndpoint(id, testEndpoints);
      expect(foundEndpoint).toEqual(endpoint);
    });
  });

  test('IDs are URL-safe (no special characters)', () => {
    testEndpoints.forEach(endpoint => {
      const id = endpointToId(endpoint);
      // Check that ID only contains letters, numbers, and hyphens
      expect(id).toMatch(/^[a-z0-9-]+$/);
      // Check that ID doesn't need URL encoding
      expect(encodeURIComponent(id)).toBe(id);
    });
  });
});
