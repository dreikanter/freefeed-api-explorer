<script lang="ts">
  export let method: string;

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'success';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  };
</script>

<span class="badge bg-{getMethodColor(method)}">
  {method}
</span>
