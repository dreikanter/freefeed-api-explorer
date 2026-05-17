<script lang="ts">
  import NavigationBar from '$lib/components/NavigationBar.svelte';
</script>

<svelte:head>
  <title>Agents - FreeFeed API Explorer</title>
</svelte:head>

<NavigationBar currentPage="agents" />

<div class="container py-2">
  <div class="row justify-content-center">
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header">
          <h3 class="mb-0">For LLM Agents</h3>
        </div>
        <div class="card-body">
          <p class="lead">
            This site supports the
            <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
              llms.txt standard
            </a>
            to help LLM agents discover and consume the FreeFeed API reference.
          </p>

          <p>
            Two markdown files are served at the site root with the full FreeFeed API reference in a format suitable for
            language models:
          </p>

          <ul>
            <li>
              <a href="/llms.txt" class="text-decoration-none"><code>/llms.txt</code></a>
              &mdash; short site description with a pointer to the full reference
            </li>
            <li>
              <a href="/llms-full.txt" class="text-decoration-none"><code>/llms-full.txt</code></a>
              &mdash; full API reference with endpoint details
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
