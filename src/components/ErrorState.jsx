import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  error,
  onRetry,
  title,
  description,
}) {
  let displayTitle = title || 'Unable to Load Stories';
  let displayDesc =
    description ||
    (error && error.message
      ? error.message
      : 'Our newsroom is temporarily unable to retrieve fresh dispatches. Please refresh or try again in a moment.');

  return (
    <div className="state-container animate-fade-in" role="alert">
      <div className="state-icon-wrap error">
        <AlertCircle size={30} />
      </div>
      <h3 className="state-title">{displayTitle}</h3>
      <p className="state-desc">{displayDesc}</p>

      {onRetry && (
        <div className="state-actions">
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      )}
    </div>
  );
}
