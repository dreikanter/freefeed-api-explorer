import { getRelativeTime, getStatusInfo } from './utils';

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
