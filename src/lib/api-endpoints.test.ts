import { describe, test, expect } from 'vitest';
import { API_ENDPOINTS } from './api-endpoints';

describe('freefeed-api.json validation', () => {
  test('has endpoints', () => {
    expect(API_ENDPOINTS.length).toBeGreaterThan(0);
  });

  test('every endpoint has required fields', () => {
    for (const ep of API_ENDPOINTS) {
      expect(ep.method).toMatch(/^(GET|POST|PUT|PATCH|DELETE)$/);
      expect(ep.path).toMatch(/^\//);
      expect(ep.description).toBeTruthy();
      expect(Array.isArray(ep.scopes)).toBe(true);
      expect(ep.scopes.length).toBeGreaterThan(0);
      expect(typeof ep.auth_required).toBe('boolean');
      expect(Array.isArray(ep.parameters)).toBe(true);
    }
  });

  test('no endpoint has a blank description', () => {
    const blank = API_ENDPOINTS.filter((ep) => !ep.description.trim());
    expect(blank).toEqual([]);
  });

  test('no duplicate endpoints', () => {
    const ids = API_ENDPOINTS.map((ep) => `${ep.method} ${ep.path}`);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  test('every parameter has required fields', () => {
    for (const ep of API_ENDPOINTS) {
      for (const param of ep.parameters) {
        expect(param.name).toBeTruthy();
        expect(param.location).toMatch(/^(path|query|body)$/);
        expect(param.type).toBeTruthy();
        expect(typeof param.required).toBe('boolean');
      }
    }
  });

  test('path parameters match path placeholders', () => {
    for (const ep of API_ENDPOINTS) {
      const placeholders = (ep.path.match(/:(\w+)/g) || []).map((p) => p.slice(1));
      const pathParams = ep.parameters.filter((p) => p.location === 'path').map((p) => p.name);

      for (const placeholder of placeholders) {
        expect(pathParams).toContain(placeholder);
      }
    }
  });

  test('no parameter has a blank description', () => {
    const blank: string[] = [];
    for (const ep of API_ENDPOINTS) {
      for (const param of ep.parameters) {
        if (!param.description?.trim()) {
          blank.push(`${ep.method} ${ep.path} -> ${param.name}`);
        }
      }
    }
    expect(blank).toEqual([]);
  });
});
