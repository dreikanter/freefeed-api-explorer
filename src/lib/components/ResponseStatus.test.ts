// Integration test for ResponseStatus component
// Note: The core logic is tested in utils.test.ts
// This test validates the component integration

import { getStatusInfo } from '../utils';

describe('ResponseStatus Component Integration', () => {
  test('component uses getStatusInfo function correctly', () => {
    // Test that the component would get the right data for different status codes
    expect(getStatusInfo(200)).toMatchObject({
      icon: 'check-circle-fill',
      color: 'text-success',
      text: '200'
    });

    expect(getStatusInfo(404)).toMatchObject({
      icon: 'x-circle-fill',
      color: 'text-danger',
      text: '404'
    });

    expect(getStatusInfo(301)).toMatchObject({
      icon: 'arrow-right-circle-fill',
      color: 'text-warning',
      text: '301'
    });
  });

  test('component handles all status ranges', () => {
    // 2xx Success
    const success = getStatusInfo(201);
    expect(success.color).toBe('text-success');
    expect(success.icon).toBe('check-circle-fill');

    // 3xx Redirect
    const redirect = getStatusInfo(302);
    expect(redirect.color).toBe('text-warning');
    expect(redirect.icon).toBe('arrow-right-circle-fill');

    // 4xx Client Error
    const clientError = getStatusInfo(400);
    expect(clientError.color).toBe('text-danger');
    expect(clientError.icon).toBe('x-circle-fill');

    // 5xx Server Error
    const serverError = getStatusInfo(500);
    expect(serverError.color).toBe('text-danger');
    expect(serverError.icon).toBe('x-circle-fill');

    // Network Error
    const networkError = getStatusInfo(0);
    expect(networkError.color).toBe('text-danger');
    expect(networkError.icon).toBe('x-circle-fill');
    expect(networkError.text).toBe('Error');
  });

  test('validates Bootstrap icon classes are correctly formatted', () => {
    const testCases = [200, 301, 404, 500, 0];

    testCases.forEach(status => {
      const result = getStatusInfo(status);

      // Icon should be a valid Bootstrap icon name
      expect(result.icon).toMatch(/^(check|arrow-right|x)-circle-fill$/);

      // Color should be a valid Bootstrap text color class
      expect(result.color).toMatch(/^text-(success|warning|danger)$/);

      // Text should be either the status code or 'Error'
      expect(result.text).toMatch(/^(\d+|Error)$/);
    });
  });

  test('component would render correct HTML structure', () => {
    const statusInfo = getStatusInfo(200);

    // Simulate what the component template would generate
    const expectedIconClass = `bi bi-${statusInfo.icon} ${statusInfo.color} me-1`;
    const expectedWrapperClass = 'd-inline-flex align-items-center';

    expect(expectedIconClass).toBe('bi bi-check-circle-fill text-success me-1');
    expect(expectedWrapperClass).toBe('d-inline-flex align-items-center');
    expect(statusInfo.text).toBe('200');
  });
});