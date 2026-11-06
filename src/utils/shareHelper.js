/**
 * Share an article using Web Share API or Clipboard fallback
 * @param {Object} shareData { title, text, url }
 * @returns {Promise<{ success: boolean, method: 'share'|'clipboard'|'none', message: string }>}
 */
export async function shareArticle({ title, text, url }) {
  const sharePayload = {
    title: title || 'NEWSLY Article',
    text: text || title || 'Read this article on NEWSLY',
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
  };

  // Try Web Share API if supported
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(sharePayload)) {
    try {
      await navigator.share(sharePayload);
      return { success: true, method: 'share', message: 'Shared successfully!' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'none', message: 'Share cancelled' };
      }
      // If error other than abort, continue to clipboard fallback
    }
  }

  // Fallback to Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(sharePayload.url);
      return { success: true, method: 'clipboard', message: 'Link copied to clipboard!' };
    } catch (err) {
      // Fallback for older browsers or restricted contexts
      return fallbackCopyTextToClipboard(sharePayload.url);
    }
  }

  return fallbackCopyTextToClipboard(sharePayload.url);
}

function fallbackCopyTextToClipboard(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return { success: true, method: 'clipboard', message: 'Link copied to clipboard!' };
    }
  } catch (err) {
    // ignore
  }
  return { success: false, method: 'none', message: 'Unable to copy link' };
}
