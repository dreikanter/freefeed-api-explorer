<script lang="ts">
  export let status: number;

  function getStatusInfo(status: number) {
    if (status >= 200 && status < 300) {
      return {
        icon: 'check-circle-fill',
        color: 'text-success',
        text: `${status}`
      };
    } else if (status >= 300 && status < 400) {
      return {
        icon: 'arrow-right-circle-fill',
        color: 'text-warning',
        text: `${status}`
      };
    } else if (status >= 400) {
      return {
        icon: 'x-circle-fill',
        color: 'text-danger',
        text: `${status}`
      };
    } else {
      return {
        icon: 'x-circle-fill',
        color: 'text-danger',
        text: 'Error'
      };
    }
  }

  $: statusInfo = getStatusInfo(status);
</script>

<span class="d-inline-flex align-items-center">
  <i class="bi bi-{statusInfo.icon} {statusInfo.color} me-1"></i>
  <span>{statusInfo.text}</span>
</span>