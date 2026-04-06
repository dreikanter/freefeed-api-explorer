# FreeFeed API Reference

Comprehensive API reference for [FreeFeed Server](https://github.com/FreeFeed/freefeed-server) (stable branch).

Source: `FreeFeed/freefeed-server` on GitHub.

## Overview

### Base URL

All public API endpoints are prefixed with `/v{N}/` where N is a positive integer (e.g., `/v1/`, `/v2/`). The current version is **v2**. Both v1 and v2 routes are registered on the same router, so endpoints are accessible at any version.

Admin endpoints use the prefix `/api/admin/`.

### Authentication

Most endpoints require authentication via a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via `POST /v2/session` (session tokens) or the App Tokens API. Some endpoints work with optional authentication (public data visible without auth, private data requires auth).

**Unauthenticated endpoints:** Password reset (`POST /v2/passwords`, `PUT /v2/passwords/:resetPasswordToken`), server info, stats.

### Common Timeline Query Parameters

Many timeline/feed endpoints share these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `offset` | integer | 0 | Number of posts to skip |
| `limit` | integer | 30 | Max posts to return (max: 120) |
| `sort` | string | - | Sort order: `created` or `updated` |
| `with-my-posts` | string | - | Include own posts: `yes`, `true`, `1`, `on` |
| `homefeed-mode` | string | - | Home feed display mode |
| `created-before` | string | - | ISO 8601 datetime upper bound |
| `created-after` | string | - | ISO 8601 datetime lower bound |

### Validation Patterns

| Name | Pattern | Description |
|------|---------|-------------|
| UUID | `^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$` | UUID v4 |
| userName | `^[A-Za-z0-9]{3,25}$` | 3-25 alphanumeric chars |
| groupName | `^[A-Za-z0-9]+(-[a-zA-Z0-9]+)*$` | 3-35 chars, alphanumeric with hyphens |
| accountName | userName or groupName | Either user or group name |
| nonEmptyString | min 1 char, contains non-whitespace | Non-blank string |

### Token Access Scopes

App tokens have scoped access. Available scopes:

- **read-my-info** - Read own profile, subscriptions, subscribers, blocked users
- **read-my-files** - Read own uploaded file info and stats
- **read-feeds** - Read posts, timelines, comments, search, direct messages
- **read-users-info** - Read other users' profiles and stats
- **read-realtime** - WebSocket realtime messages
- **manage-my-files** - Sanitize uploaded files
- **manage-notifications** - Read/manage notifications
- **manage-posts** - Create/edit/delete posts, comments, likes
- **manage-my-feeds** - Subscribe/unsubscribe, hide/save posts, manage home feeds
- **manage-profile** - Update own and group profiles
- **manage-groups** - Create groups, manage admins and members
- **manage-subscription-requests** - Accept/reject subscription requests

---

## Authentication & Sessions

### POST /v2/session
Create session (sign in).

**Scope:** No token required (username/password auth)

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |
| `password` | string | yes | Password |

**Response:** Session token and user data.

### DELETE /v2/session
Close current session (sign out).

**Scope:** Requires auth + session token

### POST /v2/session/reissue
Reissue session token.

**Scope:** Requires auth + session token

### GET /v2/session/list
List active sessions.

**Scope:** Requires auth

### PATCH /v2/session/list
Close specific sessions.

**Scope:** Requires auth

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `close` | UUID[] | no | Session IDs to close (default: []) |

---

## Password Reset

### POST /v2/passwords
Request password reset email.

**Scope:** Unauthenticated

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | yes | Account email address |

### PUT /v2/passwords/:resetPasswordToken
Reset password using token from email.

**Scope:** Unauthenticated

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resetPasswordToken` | string | yes | Token from reset email |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newPassword` | string | yes | New password |
| `passwordConfirmation` | string | yes | Must match newPassword |

---

## Users

### POST /v2/users
Create new user account.

**Scope:** manage-profile

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username (3-25 alphanumeric) |
| `screenName` | string | no | Display name |
| `email` | string | conditional | Email (required if email verification enabled) |
| `password` | string | conditional | Password (required unless externalProfileKey provided) |
| `captcha` | string | conditional | reCAPTCHA token (required if captcha enabled) |
| `invitation` | string | no | Invitation code |
| `cancel_subscription` | boolean | no | Cancel default subscription (default: false) |
| `externalProfileKey` | string | no | External auth profile key |
| `emailVerificationCode` | string | conditional | Email verification code |
| `profilePictureURL` | string | no | Profile picture URL (must start with http:// or https://) |
| `isPrivate` | boolean | no | Make feed private (default: false) |
| `isProtected` | boolean | no | Make feed protected (default: false) |

### GET /v2/users/me
Get current user profile (basic).

**Scope:** read-my-info

### GET /v2/users/whoami
Get current user profile (detailed, v2 format).

**Scope:** read-my-info

### GET /v2/users/:username
Get user profile.

**Scope:** read-users-info

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

### PUT /v2/users/:userId
Update user or group profile. Delegates to user or group controller based on feed type.

**Scope:** manage-profile

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | UUID | yes | User or group ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user.screenName` | string | no | Display name |
| `user.isPrivate` | boolean | no | Private feed |
| `user.isProtected` | boolean | no | Protected feed |
| `user.description` | string | no | Profile description |
| `user.frontendPreferences` | object | no | Frontend display preferences |
| `user.preferences` | object | no | User preferences (see Preferences) |
| `user.email` | string | no | Email (full-access tokens only) |
| `emailVerificationCode` | string | conditional | Required when changing email |

### PUT /v2/users/updatePassword
Update current user password.

**Scope:** manage-profile

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentPassword` | string | yes | Current password |
| `password` | string | yes | New password |
| `passwordConfirmation` | string | yes | Must match new password |

### POST /v2/users/updateProfilePicture
Update profile picture.

**Scope:** manage-profile

**Request body (multipart or JSON):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | file | conditional | Image file upload |
| `url` | string | conditional | Image URL |

At least one of `file` or `url` is required.

### GET /v2/users/:username/subscribers
Get user's subscribers list.

**Scope:** read-users-info

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

### GET /v2/users/:username/subscriptions
Get user's subscriptions list.

**Scope:** read-users-info

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

### GET /v2/users/:username/statistics
Get user statistics (post count, like count, etc.).

**Scope:** read-users-info

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

### GET /v2/users/blockedByMe
Get list of users blocked by current user.

**Scope:** read-my-info

### GET /v2/users/sparseMatches
Search users by prefix (autocomplete).

**Scope:** read-users-info

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `qs` | string | no | Search query (min 2 chars, lowercase alphanumeric+hyphen) |

### POST /v2/users/verifyEmail
Send email verification code.

**Scope:** manage-profile

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | yes | Email address |
| `mode` | string | no | `sign-up` or `update` |

### POST /v2/users/suspend-me
Suspend own account permanently.

**Scope:** manage-profile

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | string | yes | Current password for confirmation |

### POST /v2/users/pause-me
Pause own account temporarily.

**Scope:** manage-profile

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | string | yes | Current password for confirmation |
| `message` | string | no | Pause message to display |

### POST /v2/users/resume-me
Resume paused account.

**Scope:** manage-profile

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resumeToken` | string | yes | JWT resume token |

---

## Subscriptions & Bans

### POST /v2/users/:username/subscribe
Subscribe to user or group.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username to subscribe to |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `homeFeeds` | UUID[] | no | Home feed IDs to add subscription to (default: []) |

### PUT /v2/users/:username/subscribe
Update subscription (change home feed assignment).

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `homeFeeds` | UUID[] | yes | Home feed IDs for this subscription |

### POST /v2/users/:username/unsubscribe
Unsubscribe from user or group.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username to unsubscribe from |

### POST /v2/users/:username/sendRequest
Send subscription request to private user or group.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `homeFeeds` | UUID[] | no | Home feed IDs (default: []) |

### POST /v2/users/acceptRequest/:username
Accept incoming subscription request.

**Scope:** manage-subscription-requests

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Requesting user's username |

### POST /v2/users/rejectRequest/:username
Reject incoming subscription request.

**Scope:** manage-subscription-requests

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Requesting user's username |

### POST /v2/requests/:followedUserName/revoke
Revoke own outgoing subscription request.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `followedUserName` | string | yes | Username of user whose request to revoke |

### POST /v2/users/:username/unsubscribeFromMe
Remove a subscriber from your feed.

**Scope:** manage-subscription-requests

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Subscriber's username |

### POST /v2/users/:username/ban
Ban a user.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username to ban |

### POST /v2/users/:username/unban
Unban a user.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username to unban |

---

## Direct Messages

### GET /v2/users/getUnreadDirectsNumber
Get count of unread direct messages.

**Scope:** read-feeds

### GET /v2/users/markAllDirectsAsRead
Mark all direct messages as read.

**Scope:** manage-posts

---

## Posts

### POST /v2/posts
Create a new post.

**Scope:** manage-posts

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post.body` | string | yes | Post text content |
| `post.attachments` | UUID[] | no | Attachment IDs (default: []) |
| `meta.feeds` | string or string[] | yes | Destination feed names (accountName) |
| `meta.commentsDisabled` | boolean | no | Disable comments (default: false) |

### PUT /v2/posts/:postId
Update an existing post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post.body` | string | no | Updated post text |
| `post.attachments` | UUID[] | no | Updated attachment IDs |
| `post.feeds` | string[] | no | Updated destination feed names |

### DELETE /v2/posts/:postId
Delete a post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromFeed` | string or string[] | no | Only remove from specific feed(s), not delete entirely |

### GET /v2/posts/:postId
Get a single post with comments and likes.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxComments` | number | no | Max comments to include in response |
| `maxLikes` | number | no | Max likes to include in response |

### POST /v2/posts/byIds
Get multiple posts by their IDs.

**Scope:** read-feeds

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postIds` | UUID[] | yes | Array of post IDs (max 100, unique) |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxComments` | number | no | Max comments per post |
| `maxLikes` | number | no | Max likes per post |

### GET /v2/posts/:postId/translated-body
Get machine-translated post body.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | no | Target language code (defaults to Accept-Language header) |

### GET /v2/posts/:postId/backlinks
Get posts that link to this post.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Query parameters:** Common timeline parameters (offset, limit, sort, etc.)

### GET /v2/posts-opengraph/:postId
Get OpenGraph metadata for a post (used for link previews).

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/like
Like a post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/unlike
Remove like from a post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/hide
Hide a post from your feed.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/unhide
Unhide a previously hidden post.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/save
Save a post to your saved posts.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### DELETE /v2/posts/:postId/save
Remove a post from saved posts.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/disableComments
Disable comments on your post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/enableComments
Re-enable comments on your post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/leave
Leave a direct message conversation.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

### POST /v2/posts/:postId/notifyOfAllComments
Toggle notifications for all comments on a post.

**Scope:** manage-notifications

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | boolean | yes | Enable or disable notifications |

### POST /v2/posts/:postId/pin
Pin a post to a user or group feed.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | no | Target accountName (defaults to current user) |

### POST /v2/posts/:postId/unpin
Unpin a post.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | UUID | yes | Post ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | no | Target accountName (defaults to current user) |

---

## Comments

### POST /v2/comments
Create a new comment on a post.

**Scope:** manage-posts

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `comment.body` | string | yes | Comment text (min 1 char, must contain non-whitespace) |
| `comment.postId` | UUID | yes | Post ID to comment on |

### PUT /v2/comments/:commentId
Update an existing comment.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `comment.body` | string | yes | Updated comment text |

### DELETE /v2/comments/:commentId
Delete a comment.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

### GET /v2/comments/:commentId
Get a single comment by ID.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `unlock-banned` | string | no | Unlock banned comment content |

### GET /v2/comments/:commentId/translated-body
Get machine-translated comment body.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | no | Target language code (defaults to Accept-Language header) |

### POST /v2/comments/byIds
Get multiple comments by their IDs.

**Scope:** read-feeds

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentIds` | UUID[] | yes | Array of comment IDs (max 100, unique) |

### GET /v2/posts/:postId/comments/:seqNumber
Get a comment by its sequence number within a post.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | string | yes | Post ID (UUID or short ID) |
| `seqNumber` | integer | yes | Comment sequence number (1-based) |

### GET /v2/posts/:postId/comments/id/:commentId
Get a comment by post ID and comment ID.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `postId` | string | yes | Post ID (UUID or short ID) |
| `commentId` | string | yes | Comment ID (UUID or short ID) |

---

## Comment Likes

### POST /v2/comments/:commentId/like
Like a comment.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

### POST /v2/comments/:commentId/unlike
Remove like from a comment.

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

### GET /v2/comments/:commentId/likes
Get list of users who liked a comment.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentId` | UUID | yes | Comment ID |

---

## Timelines & Feeds

### GET /v2/timelines/home
Get home feed (River of News) with local bumps.

**Scope:** read-feeds

**Query parameters:** Common timeline parameters (offset, limit, sort, with-my-posts, homefeed-mode, created-before, created-after)

### GET /v2/timelines/home/:feedId/posts
Get posts from a specific custom home feed.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feedId` | UUID | yes | Home feed ID |

**Query parameters:** Common timeline parameters

### GET /v2/timelines/filter/discussions
Get posts you've participated in (commented or liked).

**Scope:** read-feeds

**Query parameters:** Common timeline parameters

### GET /v2/timelines/filter/directs
Get direct messages.

**Scope:** read-feeds

**Query parameters:** Common timeline parameters

### GET /v2/timelines/filter/saves
Get saved posts.

**Scope:** read-feeds

**Query parameters:** Common timeline parameters

### GET /v2/timelines/:username
Get a user's posts timeline.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

**Query parameters:** Common timeline parameters

### GET /v2/timelines/:username/likes
Get posts liked by user.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

**Query parameters:** Common timeline parameters

### GET /v2/timelines/:username/comments
Get posts commented on by user.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

**Query parameters:** Common timeline parameters

### GET /v2/bestof
Get best-of posts (most liked).

**Scope:** read-feeds

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offset` | integer | no | Number of posts to skip (default: 0) |
| `limit` | integer | no | Max posts to return (default: 30, max: 120) |

### GET /v2/everything
Get all public posts across the site.

**Scope:** read-feeds

**Query parameters:** Common timeline parameters

### GET /v2/timelines-rss/:username
Get RSS feed for a user's posts.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

### GET /v2/timelines-metatags/:username
Get HTML meta tags for a user's timeline (for embedding/SEO).

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |

---

## Home Feed Management

### GET /v2/timelines/home/list
List all home feeds for current user.

**Scope:** read-my-info

### GET /v2/timelines/home/subscriptions
List all subscription assignments to home feeds.

**Scope:** manage-my-feeds

### GET /v2/timelines/home/:feedId
Get info about a specific home feed.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feedId` | UUID | yes | Home feed ID |

### POST /v2/timelines/home
Create a new custom home feed.

**Scope:** manage-my-feeds

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | yes | Feed title (1-250 chars, must contain non-whitespace) |
| `subscribedTo` | UUID[] | no | User/group IDs to include (default: []) |

### PATCH /v2/timelines/home/:feedId
Update a home feed.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feedId` | UUID | yes | Home feed ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | no | Updated title (1-250 chars) |
| `subscribedTo` | UUID[] | no | Updated subscription list |

### DELETE /v2/timelines/home/:feedId
Delete a home feed.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `feedId` | UUID | yes | Home feed ID to delete |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupFeed` | UUID | no | Feed ID to move subscriptions to |

### PATCH /v2/timelines/home
Reorder home feeds.

**Scope:** manage-my-feeds

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reorder` | UUID[] | yes | Ordered list of feed IDs (min 1, unique) |

---

## Search

### GET /v2/search
Search posts and comments.

**Scope:** read-feeds

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `qs` | string | no | Search query string |
| `offset` | integer | no | Number of results to skip (default: 0) |
| `limit` | integer | no | Max results to return (default: 30, max: 120) |
| `sort` | string | no | Sort order: `created` or `updated` (default: `updated`) |

---

## Notifications

### GET /v2/notifications
Get notifications for current user.

**Scope:** manage-notifications

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offset` | integer | no | Number to skip (default: 0) |
| `limit` | integer | no | Max to return (default: 30) |
| `filter` | string or string[] | no | Event type filter: `mentions`, `comments`, `bans`, `subscriptions`, `groups`, `directs` |
| `startDate` | string | no | ISO 8601 date/time lower bound |
| `endDate` | string | no | ISO 8601 date/time upper bound |

### GET /v2/notifications/:notifId
Get a specific notification.

**Scope:** manage-notifications

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notifId` | string | yes | Notification ID |

### GET /v2/users/getUnreadNotificationsNumber
Get count of unread notifications.

**Scope:** manage-notifications

### POST /v2/users/markAllNotificationsAsRead
Mark all notifications as read.

**Scope:** manage-notifications

---

## Groups

### POST /v2/groups
Create a new group.

**Scope:** manage-groups

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `group.username` | string | no | Group name (3-35 chars, alphanumeric+hyphens) |
| `group.screenName` | string | no | Display name |
| `group.description` | string | no | Group description |
| `group.isPrivate` | boolean | no | Private group |
| `group.isProtected` | boolean | no | Protected group |
| `group.isRestricted` | boolean | no | Only admins can post |

### GET /v2/managedGroups
Get groups managed by current user.

**Scope:** read-my-info

### GET /v2/allGroups
Get list of all groups.

**Scope:** read-feeds

### POST /v2/groups/:groupName/updateProfilePicture
Update group profile picture.

**Scope:** manage-profile

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |

**Request body (multipart or JSON):**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | file | conditional | Image file upload |
| `url` | string | conditional | Image URL |

### POST /v2/groups/:groupName/subscribers/:adminName/admin
Promote a group subscriber to admin.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `adminName` | string | yes | Username to promote |

### POST /v2/groups/:groupName/subscribers/:adminName/unadmin
Demote a group admin.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `adminName` | string | yes | Username to demote |

### POST /v2/groups/:groupName/sendRequest
Send request to join a group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |

### POST /v2/groups/:groupName/acceptRequest/:userName
Accept a user's request to join group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `userName` | string | yes | Requesting user's username |

### POST /v2/groups/:groupName/rejectRequest/:userName
Reject a user's request to join group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `userName` | string | yes | Requesting user's username |

### POST /v2/groups/:groupName/unsubscribeFromGroup/:userName
Remove a user from group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `userName` | string | yes | Username to remove |

### GET /v2/groups/:groupName/blockedUsers
Get list of users blocked from group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |

### POST /v2/groups/:groupName/block/:userName
Block a user from group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `userName` | string | yes | Username to block |

### POST /v2/groups/:groupName/unblock/:userName
Unblock a user from group.

**Scope:** manage-groups

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |
| `userName` | string | yes | Username to unblock |

### POST /v2/groups/:groupName/disableBans
Disable bans in group (allow banned users to see group posts).

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |

### POST /v2/groups/:groupName/enableBans
Enable bans in group.

**Scope:** manage-my-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | yes | Group name |

---

## Attachments

### POST /v2/attachments
Upload a new attachment (file).

**Scope:** manage-posts

**Request body:** Multipart file upload with `file` field.

### GET /v2/attachments/my
List current user's uploaded attachments.

**Scope:** read-my-files

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | no | Max results (default: 30, max: 100) |
| `page` | integer | no | Page number (default: 1) |

### GET /v2/attachments/my/stats
Get upload statistics for current user.

**Scope:** read-my-files

### POST /v2/attachments/my/sanitize
Sanitize metadata of uploaded files (strip EXIF etc.).

**Scope:** manage-my-files

### GET /v2/attachments/:attId
Get attachment metadata by ID.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attId` | UUID | yes | Attachment ID |

### GET /v2/attachments/:attId/:type
Get attachment preview/variant in specific format.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attId` | UUID | yes | Attachment ID |
| `type` | string | yes | Variant type: `original`, `image`, `video`, `audio` |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | no | Image format: `webp`, `jpeg`, `avif` |
| `width` | integer | no | Desired width (positive) |
| `height` | integer | no | Desired height (positive) |
| `redirect` | flag | no | Redirect to file URL |
| `download` | flag | no | Force download disposition |

### POST /v2/attachments/byIds
Get multiple attachments by their IDs.

**Scope:** read-feeds

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | UUID[] | yes | Array of attachment IDs (unique) |

---

## Bookmarklet

### POST /v2/bookmarklet
Create a post from bookmarklet data.

**Scope:** manage-posts

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | yes | Post body text (min 1 char, non-whitespace) |
| `comment` | string | no | Optional comment text (default: '') |
| `images` | string[] | no | Image URLs (default: []) |
| `image` | string | no | Single image URL (default: '') |
| `meta.feeds` | string or string[] | no | Destination feed names (default: []) |

---

## Undo

### POST /v2/undo/:subject
Undo a recent action (post/comment deletion).

**Scope:** manage-posts

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | string | yes | Action type: `post-delete` or `comment-delete` |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | yes | JWT undo token (received in delete response) |

---

## App Tokens

### GET /v2/app-tokens/scopes
Get list of available token scopes and their descriptions.

**Scope:** No auth required

### GET /v2/app-tokens
List current user's app tokens.

**Scope:** Requires auth

### POST /v2/app-tokens
Create a new app token.

**Scope:** Requires auth

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | yes | Token title (1-250 chars, non-whitespace) |
| `scopes` | string[] | no | Access scopes (default: []) |
| `expiresAt` | number or string | no | Expiry as Unix timestamp or ISO 8601 datetime |
| `restrictions` | object | yes | Access restrictions (default: {origins: [], netmasks: []}) |
| `restrictions.origins` | string[] | no | Allowed origin URLs (default: []) |
| `restrictions.netmasks` | string[] | no | Allowed IP netmasks (default: []) |

### POST /v2/app-tokens/activate
Activate an app token using activation code.

**Scope:** Requires auth

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activationCode` | string | yes | Activation code |

### GET /v2/app-tokens/current
Get the current app token (when authenticated via app token).

**Scope:** Requires app token auth

### POST /v2/app-tokens/current/reissue
Regenerate the current app token.

**Scope:** Requires app token auth

### POST /v2/app-tokens/:tokenId/reissue
Regenerate a specific app token.

**Scope:** Requires auth

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | string | yes | App token ID |

### PUT /v2/app-tokens/:tokenId
Update an app token's title.

**Scope:** Requires auth

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | string | yes | App token ID |

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | yes | Updated title (1-250 chars, non-whitespace) |

### DELETE /v2/app-tokens/:tokenId
Deactivate (delete) an app token.

**Scope:** Requires auth

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | string | yes | App token ID |

---

## Invitations

### GET /v2/invitations/info
Get invitation creation limits and info for current user.

**Scope:** Requires auth

### GET /v2/invitations/:secureId
Get invitation details by secure ID.

**Scope:** No auth required

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `secureId` | string | yes | Invitation secure ID |

### POST /v2/invitations
Create a new invitation.

**Scope:** Requires auth

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | yes | Invitation message (non-empty) |
| `lang` | string | yes | Language code (non-empty) |
| `singleUse` | boolean | yes | Whether invitation can only be used once |
| `users` | string[] | no | Usernames to recommend following |
| `groups` | string[] | no | Group names to recommend joining |

---

## External Authentication

### GET /v2/ext-auth/profiles
List linked external authentication profiles.

**Scope:** Requires auth

### DELETE /v2/ext-auth/profiles/:profileId
Remove a linked external auth profile.

**Scope:** Requires auth

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `profileId` | string | yes | External profile ID |

### POST /v2/ext-auth/auth-start
Start external authentication flow (OAuth).

**Scope:** Requires auth (for connect mode)

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | yes | Auth provider name (max 50 chars) |
| `redirectURL` | string | yes | Callback URL (max 250 chars, must start with http:// or https://) |
| `mode` | string | yes | Auth mode: `connect` (link to existing account) or `sign-in` |

### POST /v2/ext-auth/auth-finish
Complete external authentication flow.

**Scope:** Conditional (required for connect mode)

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | yes | Auth provider name (max 50 chars) |
| `query` | object | yes | OAuth callback query parameters |

---

## Archives (FriendFeed Import)

### POST /v2/archives/restoration
Start FriendFeed archive restoration.

**Scope:** Requires auth

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `disable_comments` | boolean | no | Disable comments on restored posts (default: false) |
| `via_restore` | string[] | no | Via sources for restoration (default: []) |

### PUT /v2/archives/activities
Start activity restoration from archive.

**Scope:** Requires auth

**Request body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `restore` | boolean | yes | Must be `true` |

### GET /v2/archives/post-by-old-name/:name
Look up a post by its old FriendFeed name/URL.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Old FriendFeed post name |

### GET /v2/archives-stats
Get archive restoration statistics.

**Scope:** No auth required

---

## Calendar

### GET /v2/calendar/:username/:year
Get days with posts in a given year.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |
| `year` | integer | yes | Year (e.g. 2024) |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tz` | string | no | IANA timezone (e.g. `America/New_York`) |

### GET /v2/calendar/:username/:year/:month
Get days with posts in a given month.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |
| `year` | integer | yes | Year |
| `month` | integer | yes | Month (1-12) |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tz` | string | no | IANA timezone |

### GET /v2/calendar/:username/:year/:month/:day
Get posts for a specific date.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |
| `year` | integer | yes | Year |
| `month` | integer | yes | Month (1-12) |
| `day` | integer | yes | Day (1-31) |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offset` | integer | no | Number of posts to skip (default: 0) |
| `tz` | string | no | IANA timezone |

---

## Summary

### GET /v2/summary/:days
Get general site summary (most popular posts).

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | integer | yes | Number of days to summarize (1-30) |

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | no | Max posts to return |

### GET /v2/summary/:username/:days
Get user-specific summary.

**Scope:** read-feeds

**Path parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | yes | Username |
| `days` | integer | yes | Number of days to summarize (1-30) |

---

## Hashtags

### GET /v2/hashtags/sparseMatches
Search hashtags by prefix (autocomplete).

**Scope:** Requires auth

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `qs` | string | no | Search query |

---

## Statistics

### GET /v2/stats
Get site-wide statistics.

**Scope:** No auth required

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | string | no | Data type (default: `users`) |
| `start_date` | string | no | Start date (min: 2015-05-04, FreeFeed launch date) |
| `end_date` | string | no | End date (max: today) |

Max date span: 2 years.

---

## Server Info

### GET /v2/server-info
Get server configuration info (text limits, supported features, etc.).

**Scope:** No auth required

---

## CORS Proxy

### GET /v2/cors-proxy
Proxy a URL fetch to bypass CORS restrictions.

**Scope:** Requires auth

**Query parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | yes | URL to proxy (must be on allowed list) |

**Headers:** `Origin` header must be in allowed origins list.

---

## Data Models

### Post
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Post unique ID |
| `shortId` | string | Short post ID |
| `body` | string | Post text content |
| `attachments` | UUID[] | Attachment IDs |
| `userId` | UUID | Author user ID |
| `commentsDisabled` | boolean | Comments disabled flag |
| `commentsCount` | number | Total comment count |
| `likesCount` | number | Total like count |
| `isPrivate` | string | `0` or `1` |
| `isProtected` | string | `0` or `1` |
| `isPropagable` | string | `0` or `1` |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
| `bumpedAt` | string | ISO 8601 timestamp |
| `friendfeedUrl` | string | Legacy FriendFeed URL |

### User
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User unique ID |
| `username` | string | Login name |
| `screenName` | string | Display name |
| `email` | string | Email address |
| `description` | string | Profile description |
| `type` | string | `user` |
| `isPrivate` | string | `0` or `1` |
| `isProtected` | string | `0` or `1` |
| `profilePictureUuid` | string | Profile picture attachment ID |
| `frontendPreferences` | object | UI preferences |
| `preferences` | object | Account preferences |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

### User Preferences
| Field | Type | Description |
|-------|------|-------------|
| `hideCommentsOfTypes` | integer[] | Comment types to hide |
| `sendNotificationsDigest` | boolean | Email notification digest |
| `sendDailyBestOfDigest` | boolean | Daily best-of email |
| `sendWeeklyBestOfDigest` | boolean | Weekly best-of email |
| `acceptDirectsFrom` | string | Who can send DMs: `all` or `friends` |
| `sanitizeMediaMetadata` | boolean | Strip media metadata on upload |
| `notifyOfCommentsOnMyPosts` | boolean | Notify on comments to own posts |
| `notifyOfCommentsOnCommentedPosts` | boolean | Notify on comments to posts you commented |

### Group
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Group unique ID |
| `username` | string | Group name (3-35 chars) |
| `screenName` | string | Display name |
| `description` | string | Group description |
| `type` | string | `group` |
| `isPrivate` | string | `0` or `1` |
| `isProtected` | string | `0` or `1` |
| `isRestricted` | string | `0` or `1` - only admins can post |
| `administratorIds` | UUID[] | Admin user IDs |

### Comment
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Comment unique ID |
| `shortId` | string | Short comment ID |
| `body` | string | Comment text content |
| `userId` | UUID | Author user ID |
| `postId` | UUID | Parent post ID |
| `seqNumber` | number | Sequence number within post |
| `hideType` | integer | 0=visible, 1=deleted, 2=hidden_banned, 3=hidden_archived, 4=hidden_viewer_banned |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

### Attachment
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Attachment unique ID |
| `fileName` | string | Original file name |
| `fileSize` | number | File size in bytes |
| `mimeType` | string | MIME type |
| `fileExtension` | string | File extension |
| `mediaType` | string | Media category |
| `width` | number or null | Image/video width |
| `height` | number or null | Image/video height |
| `duration` | number or null | Audio/video duration |
| `artist` | string | Audio artist metadata |
| `title` | string | Audio title metadata |
| `userId` | UUID | Uploader user ID |
| `postId` | UUID or null | Associated post ID |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
