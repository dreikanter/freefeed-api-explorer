# FreeFeed API Explorer

An interactive web application for exploring and testing the FreeFeed API, providing an easy way to learn and experiment with all available endpoints.

## Features

- **Interactive API Reference**: Browse all FreeFeed API endpoints organized by scope.
- **Search & Filter**: Find endpoints by name, description, or scope.
- **Interactive Testing**: Execute real API requests with parameter validation.
- **Response Inspection**: View formatted JSON responses, headers, and status codes.
- **Code Generation**: Generate ready-to-use `fetch()` JavaScript code and `curl` commands.
- **Request History**: Keep track of all your API requests with local storage.
- **Privacy-First**: Your API token and request history are stored locally and never sent to third parties. Both can be wiped on demand. No tracking, no telemetry, no retention period, no nonsense.

## Getting Started

### Prerequisites

- Node.js 18+ or compatible version.
- A FreeFeed API token (obtain from your FreeFeed account settings).

### Installation

```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Privacy & Security

- **Local Storage**: Your API token and request history are stored in browser localStorage and can be instantly wiped on demand.
- **No Third-Party Tracking**: No analytics or tracking services are included.
- **Direct API Communication**: Requests go directly from your browser to FreeFeed.

## Contributing

This project is open for contributions! Keeping the API endpoints reference up to date is especialy welcome (see `src/lib/api-endpoints.ts`).

## FreeFeed Resources

- FreeFeed Server Source Code: https://github.com/FreeFeed/freefeed-server
