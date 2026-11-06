import React from 'react';
import { AlertCircle, Key, RefreshCw, Settings, ShieldAlert } from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import ApiConfigHero from './ApiConfigHero';

export default function ErrorState({
  error,
  onRetry,
  title,
  description,
}) {
  const { openConfigModal } = useApiKey();

  const isMissingKey = error && error.code === 'MISSING_KEY';
  const isInvalidKey = error && error.code === 'INVALID_KEY';
  const isRateLimited = error && error.code === 'RATE_LIMITED';

  // If missing key, render the dedicated premium configuration card directly!
  if (isMissingKey) {
    return <ApiConfigHero onConfigured={onRetry} />;
  }

  let displayTitle = title || 'Unable to Load Stories';
  let displayDesc = description || (error ? error.message : 'An unexpected error occurred while communicating with the news service.');

  if (isInvalidKey) {
    displayTitle = 'Invalid API Credentials';
    displayDesc = 'The configured API key was rejected by the news service. Please verify your credentials or update your API key.';
  } else if (isRateLimited) {
    displayTitle = 'API Rate Limit Reached';
    displayDesc = 'The quota for this API key has been exhausted for the current window. Please wait a moment or switch to another provider.';
  }

  return (
    <div className="state-container animate-fade-in" role="alert">
      <div className="state-icon-wrap error">
        {isInvalidKey ? <Key size={30} /> : <AlertCircle size={30} />}
      </div>
      <h3 className="state-title">{displayTitle}</h3>
      <p className="state-desc">{displayDesc}</p>

      <div className="state-actions">
        {isInvalidKey && (
          <button
            type="button"
            onClick={openConfigModal}
            className="btn btn-accent"
          >
            <Key size={15} /> Update API Key
          </button>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-primary"
          >
            <RefreshCw size={15} /> Try Again
          </button>
        )}

        <button
          type="button"
          onClick={openConfigModal}
          className="btn btn-outline"
        >
          <Settings size={15} /> API Settings
        </button>
      </div>
    </div>
  );
}
