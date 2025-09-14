import type { ApiEndpoint, FreeFeedInstance } from './types.js';

export const FREEFEED_INSTANCES: FreeFeedInstance[] = [
  {
    name: 'Staging (candy.freefeed.net)',
    url: 'https://candy.freefeed.net',
    description: 'Development and testing environment',
  },
  {
    name: 'Production (freefeed.net)',
    url: 'https://freefeed.net',
    description: 'Live production environment',
  },
];

export const API_ENDPOINTS: ApiEndpoint[] = [
  // read-my-info scope
  {
    method: 'GET',
    path: '/v4/users/whoami',
    description: 'Get my user information',
    scope: 'read-my-info',
  },
  {
    method: 'GET',
    path: '/v4/managedGroups',
    description: 'Get groups that I manage',
    scope: 'read-my-info',
  },
  {
    method: 'GET',
    path: '/v4/users/blockedByMe',
    description: 'Get users blocked by me',
    scope: 'read-my-info',
  },
  {
    method: 'GET',
    path: '/v4/timelines/home/list',
    description: 'Get my home timeline list',
    scope: 'read-my-info',
  },

  // read-my-files scope
  {
    method: 'GET',
    path: '/v4/attachments/my',
    description: 'Get my uploaded files',
    scope: 'read-my-files',
  },
  {
    method: 'GET',
    path: '/v4/attachments/my/stats',
    description: 'Get my file upload statistics',
    scope: 'read-my-files',
  },

  // read-feeds scope
  {
    method: 'GET',
    path: '/v4/timelines/home',
    description: 'Get home timeline posts',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of posts to skip',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of posts to return (default: 30)',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/timelines/home/:feedId/posts',
    description: 'Get posts from a specific home feed',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'feedId',
        type: 'string',
        required: true,
        description: 'Feed ID',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of posts to skip',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of posts to return (default: 30)',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/timelines/filter/discussions',
    description: 'Get discussion posts',
    scope: 'read-feeds',
  },
  {
    method: 'GET',
    path: '/v4/timelines/filter/directs',
    description: 'Get direct messages',
    scope: 'read-feeds',
  },
  {
    method: 'GET',
    path: '/v4/timelines/filter/saves',
    description: 'Get saved posts',
    scope: 'read-feeds',
  },
  {
    method: 'GET',
    path: '/v4/users/getUnreadDirectsNumber',
    description: 'Get number of unread direct messages',
    scope: 'read-feeds',
  },
  {
    method: 'GET',
    path: '/v4/timelines/:username',
    description: 'Get user timeline',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of posts to skip',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of posts to return (default: 30)',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/timelines/:username/likes',
    description: 'Get posts liked by user',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of posts to skip',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of posts to return (default: 30)',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/timelines/:username/comments',
    description: 'Get user comments',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of posts to skip',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of posts to return (default: 30)',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/search',
    description: 'Search posts and comments',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'q',
        type: 'string',
        required: true,
        description: 'Search query',
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Number of results to skip',
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of results to return (default: 30)',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/posts/:postId',
    description: 'Get single post',
    scope: 'read-feeds',
    parameters: [
      {
        name: 'postId',
        type: 'string',
        required: true,
        description: 'Post ID',
      },
    ],
  },

  // read-users-info scope
  {
    method: 'GET',
    path: '/v4/users/:username',
    description: 'Get user information',
    scope: 'read-users-info',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/users/:username/statistics',
    description: 'Get user statistics',
    scope: 'read-users-info',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/users/:username/subscribers',
    description: 'Get user subscribers',
    scope: 'read-users-info',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
    ],
  },
  {
    method: 'GET',
    path: '/v4/users/:username/subscriptions',
    description: 'Get user subscriptions',
    scope: 'read-users-info',
    parameters: [
      {
        name: 'username',
        type: 'string',
        required: true,
        description: 'Username',
      },
    ],
  },

  // manage-posts scope
  {
    method: 'POST',
    path: '/v4/posts',
    description: 'Create new post',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'body',
        type: 'string',
        required: true,
        description: 'Post content',
      },
      {
        name: 'feeds',
        type: 'string',
        required: false,
        description: 'Comma-separated list of feed IDs',
      },
    ],
  },
  {
    method: 'PUT',
    path: '/v4/posts/:postId',
    description: 'Update post',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'postId',
        type: 'string',
        required: true,
        description: 'Post ID',
      },
      {
        name: 'body',
        type: 'string',
        required: true,
        description: 'Updated post content',
      },
    ],
  },
  {
    method: 'DELETE',
    path: '/v4/posts/:postId',
    description: 'Delete post',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'postId',
        type: 'string',
        required: true,
        description: 'Post ID',
      },
    ],
  },
  {
    method: 'POST',
    path: '/v4/posts/:postId/like',
    description: 'Like post',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'postId',
        type: 'string',
        required: true,
        description: 'Post ID',
      },
    ],
  },
  {
    method: 'POST',
    path: '/v4/posts/:postId/unlike',
    description: 'Unlike post',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'postId',
        type: 'string',
        required: true,
        description: 'Post ID',
      },
    ],
  },
  {
    method: 'POST',
    path: '/v4/comments',
    description: 'Create comment',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'body',
        type: 'string',
        required: true,
        description: 'Comment content',
      },
      {
        name: 'postId',
        type: 'string',
        required: true,
        description: 'Post ID',
      },
    ],
  },
  {
    method: 'PUT',
    path: '/v4/comments/:commentId',
    description: 'Update comment',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'commentId',
        type: 'string',
        required: true,
        description: 'Comment ID',
      },
      {
        name: 'body',
        type: 'string',
        required: true,
        description: 'Updated comment content',
      },
    ],
  },
  {
    method: 'DELETE',
    path: '/v4/comments/:commentId',
    description: 'Delete comment',
    scope: 'manage-posts',
    parameters: [
      {
        name: 'commentId',
        type: 'string',
        required: true,
        description: 'Comment ID',
      },
    ],
  },
];
