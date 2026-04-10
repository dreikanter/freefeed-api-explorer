// @vitest-environment node

import { describe, test, expect } from 'vitest';
import { generateMarkdown } from './generate-llms-txt.mjs';

const sampleData = {
  meta: {
    server_repo: 'FreeFeed/freefeed-server',
    server_branch: 'stable',
    server_rev: 'abc123',
    synced_at: '2026-04-06',
    total_endpoints: 3,
    format_version: 1,
  },
  endpoints: [
    {
      method: 'GET',
      path: '/v2/posts',
      description: 'Get posts.',
      auth_required: true,
      scopes: ['read-feeds'],
      parameters: [],
    },
    {
      method: 'GET',
      path: '/v2/posts/:postId',
      description: 'Get a single post.',
      auth_required: false,
      scopes: ['read-feeds'],
      parameters: [
        {
          name: 'postId',
          location: 'path',
          type: 'string',
          required: true,
          description: 'Post UUID',
        },
      ],
    },
    {
      method: 'POST',
      path: '/v2/users/login',
      description: 'Log in.',
      auth_required: false,
      scopes: ['any'],
      parameters: [
        {
          name: 'username',
          location: 'body',
          type: 'string',
          required: true,
          description: 'Username',
        },
        {
          name: 'password',
          location: 'body',
          type: 'string',
          required: true,
          description: 'Password',
        },
      ],
    },
  ],
};

describe('generateMarkdown', () => {
  const md = generateMarkdown(sampleData);

  test('starts with title', () => {
    expect(md).toMatch(/^# FreeFeed API Reference/);
  });

  test('includes meta info', () => {
    expect(md).toContain('FreeFeed/freefeed-server');
    expect(md).toContain('2026-04-06');
    expect(md).toContain('3 endpoints');
  });

  test('groups endpoints by path prefix', () => {
    expect(md).toContain('### /v2/posts');
    expect(md).toContain('### /v2/users');
  });

  test('renders endpoint headings', () => {
    expect(md).toContain('#### GET /v2/posts');
    expect(md).toContain('#### GET /v2/posts/:postId');
    expect(md).toContain('#### POST /v2/users/login');
  });

  test('renders descriptions', () => {
    expect(md).toContain('Get posts.');
    expect(md).toContain('Get a single post.');
    expect(md).toContain('Log in.');
  });

  test('renders auth and scope info', () => {
    expect(md).toContain('- Auth required: yes');
    expect(md).toContain('- Auth required: no');
    expect(md).toContain('`read-feeds`');
  });

  test('renders parameter tables', () => {
    expect(md).toContain('| postId | path | string | yes | Post UUID |');
    expect(md).toContain('| username | body | string | yes | Username |');
  });

  test('omits parameter table for endpoints with no parameters', () => {
    // GET /v2/posts has no params — there should be no table header immediately after its scope line
    const getPostsSection = md.split('#### GET /v2/posts\n')[1].split('####')[0];
    expect(getPostsSection).not.toContain('| Parameter |');
  });
});
