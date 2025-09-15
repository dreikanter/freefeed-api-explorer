<script lang="ts">
  import NavigationBar from '$lib/components/NavigationBar.svelte';
</script>

<svelte:head>
  <title>About - FreeFeed API Explorer</title>
</svelte:head>

<NavigationBar currentPage="about" />

<div class="container mb-4">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header">
          <h3 class="mb-0">About FreeFeed API Explorer</h3>
        </div>
        <div class="card-body">
          <p class="lead">
            A web-based tool for exploring and testing the FreeFeed API endpoints.
          </p>

          <p>
            This application allows you to browse available API endpoints, execute requests with custom parameters,
            and view responses in a clean interface. It includes features like:
          </p>

          <ul>
            <li>Interactive API endpoint browser with search and filtering</li>
            <li>Parameter input forms with validation</li>
            <li>Request execution with real-time responses</li>
            <li>Code generation for fetch() and curl commands</li>
            <li>Request history tracking</li>
            <li>Local storage for tokens and preferences</li>
          </ul>

          <p>
            Built with SvelteKit, TypeScript, and Bootstrap 5. This is an open-source project available on GitHub.
          </p>

          <p>
            <strong>Privacy & Security:</strong> All data is stored locally in your browser
            and no information is sent to third-party services except when making API requests to FreeFeed instances.
          </p>

          <div class="mt-4">
            <p class="mb-2">
              <strong>GitHub:</strong>
              <a
                href="https://github.com/dreikanter/freefeed-api-explorer"
                target="_blank"
                rel="noopener noreferrer"
                class="text-decoration-none"
              >
                https://github.com/dreikanter/freefeed-api-explorer
              </a>
            </p>
            <p class="mb-2">
              <strong>FreeFeed:</strong>
              <a
                href="https://github.com/FreeFeed/freefeed-server"
                target="_blank"
                rel="noopener noreferrer"
                class="text-decoration-none"
              >
                https://github.com/FreeFeed/freefeed-server
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>