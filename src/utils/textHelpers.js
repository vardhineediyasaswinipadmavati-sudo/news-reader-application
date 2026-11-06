/**
 * Estimate reading time from text content
 * Average adult reads 200-250 words per minute
 */
export function estimateReadingTime(text) {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Clean & truncate text cleanly at word boundaries
 */
export function truncateText(text, maxLength = 120) {
  if (!text) return '';
  const cleaned = text.replace(/<[^>]*>?/gm, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, cleaned.lastIndexOf(' ', maxLength)) + '...';
}

/**
 * Generate a deterministic safe string ID from URL or title
 */
export function generateArticleId(article) {
  if (!article) return String(Date.now());
  if (article.id) return String(article.id);
  const base = article.url || article.title || String(Date.now());
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
