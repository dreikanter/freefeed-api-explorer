<script lang="ts">
  export let method: string;
</script>

<span
  class="badge bg-{method === 'GET'
    ? 'success'
    : method === 'POST'
      ? 'primary'
      : method === 'PUT'
        ? 'warning'
        : method === 'DELETE'
          ? 'danger'
          : 'secondary'}"
>
  {method}
</span>
