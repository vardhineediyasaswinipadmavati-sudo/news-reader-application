import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { shareArticle } from '../utils/shareHelper';
import { useToast } from './Toast';

export default function ShareButton({
  article,
  variant = 'icon', // 'icon' | 'button'
  className = '',
}) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!article) return;

    const result = await shareArticle({
      title: article.title,
      text: article.description || article.title,
      url: article.url && article.url !== '#' ? article.url : window.location.href,
    });

    if (result.success) {
      if (result.method === 'clipboard') {
        setCopied(true);
        addToast('Link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      } else {
        addToast('Shared successfully!', 'success');
      }
    } else if (result.method !== 'none') {
      addToast(result.message || 'Could not share article', 'error');
    }
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`btn btn-outline ${className}`}
        aria-label="Share this article"
      >
        {copied ? <Check size={16} color="#16a34a" /> : <Share2 size={16} />}
        <span>{copied ? 'Copied' : 'Share'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`action-btn-mini ${className}`}
      aria-label="Share article"
      title={copied ? 'Copied!' : 'Share article'}
    >
      {copied ? <Check size={16} color="#16a34a" /> : <Share2 size={16} />}
    </button>
  );
}
