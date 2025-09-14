import { getRelativeTime } from './utils';

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
