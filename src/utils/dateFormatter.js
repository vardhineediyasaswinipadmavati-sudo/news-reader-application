/**
 * Format an ISO date string into human-readable editorial date
 * @param {string|Date} dateString 
 * @returns {string} e.g. "Nov 4, 2026" or "Nov 4, 2026, 10:15 AM"
 */
export function formatPublicationDate(dateString) {
  if (!dateString) return 'Recent';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Recent';
  }
}

/**
 * Format date with time for detailed views
 */
export function formatFullDateTime(dateString) {
  if (!dateString) return 'Date unknown';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date unknown';

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'Date unknown';
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 7) {
      return formatPublicationDate(dateString);
    } else if (diffDay > 1) {
      return `${diffDay} days ago`;
    } else if (diffDay === 1) {
      return 'Yesterday';
    } else if (diffHour >= 1) {
      return `${diffHour}h ago`;
    } else if (diffMin >= 1) {
      return `${diffMin}m ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return 'Recently';
  }
}

/**
 * Get formatted current date for masthead header
 * e.g. "Wednesday, November 4, 2026"
 */
export function getMastheadDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}
