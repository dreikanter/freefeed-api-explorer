<script lang="ts">
  export let method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  const getMethodColor = (method: typeof method) => {
    switch (method) {
      case 'GET': return 'success';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'PATCH': return 'info';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  };
</script>

<span class="badge bg-{getMethodColor(method)}">
  {method}
</span>
