Assume you can access the external URLs:
- https://github.com/FreeFeed/freefeed-server
- https://freefeed.net
- https://candy.freefeed.net

# Implementation Plan for FreeFeed API Explorer

## Context

FreeFeed is an open source social network with a Node-based server implementing JSON REST API with JWT authentication and a React client.

## General Concept

The application will serve as an interactive API reference where users can view all available endpoints with short descriptions, try sending requests to each, and see response structures. This tool will help developers create custom applications that integrate with FreeFeed.

## Application Features

This is a one-page browser application with the following flow:
- User specifies their API token, which is temporarily stored in the application
- User views the reference of available API endpoints
- User can execute HTTP requests by selecting an endpoint, HTTP method, and required parameters
- User sees server responses: response code, HTTP headers, formatted JSON body
- User has access to their request history and can revisit any previous request
- User can reset history
- User can reset the token
- User can copy generated code for specific requests (`fetch()` call or `curl` command)

This application functions like Postman HTTP Client but with a web UI, specialized for a single API for educational, experimental, and debugging purposes.

## Tech Stack

- Svelte and TypeScript
- Bootstrap 5 for CSS (avoiding custom CSS code)
- Vite for building (minimal configuration, using defaults)
- ESLint and Prettier integrated into the development workflow

## Functional Requirements

- Client-side application
- Use localStorage to persist tokens and request history
- No authentication required (besides providing JWT) as this is a single-user application
- UI should clearly explain that the token is temporarily stored on the user's computer and can be deleted at any time (same for request history)
- Support for multiple FreeFeed instances:
  - https://candy.freefeed.net (staging, default)
  - https://freefeed.net (production)

## Request Example

```
export FREEFEED_TOKEN="..."
export FREEFEED_HOST="https://candy.freefeed.net"

curl -v \
  -H "Authorization: Bearer $FREEFEED_TOKEN" \
  -H "Accept: application/json" \
  -H "User-Agent: FreeFeed-Token-Validator" \
  "$FREEFEED_HOST/v4/users/whoami"
```

## References

- See `references/freefeed-api.md` for the endpoints list
- FreeFeed server sources: https://github.com/FreeFeed/freefeed-server
