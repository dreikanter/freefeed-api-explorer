<script lang="ts">
  import { getStatusInfo } from '../utils.js';

  export let status: number;

  $: statusInfo = getStatusInfo(status);
</script>

<span class="d-inline-flex align-items-center">
  <i class="bi bi-{statusInfo.icon} {statusInfo.color} me-1"></i>
  <span>{statusInfo.text}</span>
</span>