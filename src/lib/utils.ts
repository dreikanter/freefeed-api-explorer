export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getStatusInfo(status: number) {
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
