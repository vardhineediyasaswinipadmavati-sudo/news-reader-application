import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import { PROVIDERS } from '../services/apiConfig';
import { useToast } from './Toast';

export default function ApiConfigHero({ onConfigured }) {
  const { apiKey, provider, setApiKey, setProvider, getApiKeyForProvider } = useApiKey();
  const { addToast } = useToast();

  const [selectedProvider, setSelectedProvider] = useState(provider || 'gnews');
  const [inputKey, setInputKey] = useState(() => {
    const initialKey = getApiKeyForProvider ? getApiKeyForProvider(provider || 'gnews') : apiKey;
    return initialKey && initialKey !== 'test' ? initialKey : '';
  });
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProviderMeta = PROVIDERS[selectedProvider] || PROVIDERS.gnews;

  const handleSave = (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();

    if (!cleanKey) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid API key to connect the news feed.',
      });
      return;
    }

    if (selectedProvider === 'guardian' && cleanKey.toLowerCase() === 'test') {
      setStatusMessage({
        type: 'error',
        text: 'The Guardian Content API no longer authorizes the generic "test" key. Please register your free developer key at open-platform.theguardian.com/access/',
      });
      return;
    }

    setIsSubmitting(true);
    setProvider(selectedProvider);
    setApiKey(cleanKey, selectedProvider);

    setStatusMessage({
      type: 'success',
      text: `Connecting to ${activeProviderMeta.name}... Fetching live dispatches.`,
    });
    addToast('API credentials saved successfully!', 'success');

    setTimeout(() => {
      setIsSubmitting(false);
      if (onConfigured) onConfigured();
    }, 600);
  };

  return (
    <div className="api-config-hero animate-fade-in" role="region" aria-label="API Configuration Setup">
      {/* Editorial Header Banner */}
      <div className="api-config-header">
        <div className="api-config-badge">
          <ShieldCheck size={14} color="var(--accent)" />
          <span>Authentic REST API Gateway</span>
        </div>
        <h2 className="api-config-title">Connect Your Real-Time News Feed</h2>
        <p className="api-config-subtitle">
          NEWSLY streams genuine, verified journalism directly from accredited global news APIs.
          No synthetic articles, no hardcoded headlines, and no fabricated content.
        </p>
      </div>

      {/* Provider Selector Ribbon */}
      <div className="api-provider-grid">
        {Object.entries(PROVIDERS).map(([key, meta]) => {
          const isSelected = selectedProvider === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => {
                setSelectedProvider(key);
                const existingKey = getApiKeyForProvider ? getApiKeyForProvider(key) : '';
                setInputKey(existingKey && existingKey !== 'test' ? existingKey : '');
                setStatusMessage(null);
              }}
              className={`api-provider-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="api-provider-name">{meta.name}</div>
              <div className="api-provider-limit">{meta.freeLimit}</div>
              <div className="api-provider-desc">{meta.description}</div>
            </button>
          );
        })}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSave} className="api-config-form">
        <div className="api-form-row">
          <div className="api-input-wrap">
            <Key size={18} className="api-input-icon" />
            <input
              type="text"
              className="api-hero-input"
              placeholder={`Enter your ${activeProviderMeta.name} personal developer key...`}
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                if (statusMessage) setStatusMessage(null);
              }}
              aria-label="API Key"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-accent api-connect-btn"
          >
            <span>Connect Feed</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Helpful Info Notice */}
        <div className="api-instant-row">
          <div className="api-instant-desc">
            <Info size={14} color="var(--accent)" />
            <span>
              {selectedProvider === 'guardian'
                ? 'The Guardian requires each developer to register their personal free key.'
                : `Enter your free ${activeProviderMeta.name} API key to start reading.`}
            </span>
          </div>
          <a
            href={activeProviderMeta.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <span>Register Free Key at {activeProviderMeta.name}</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Status Feedback Message */}
        {statusMessage && (
          <div
            className={`api-status-feedback ${statusMessage.type === 'success' ? 'success' : 'error'}`}
            role="alert"
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </form>

      {/* Clear Instructions Footer */}
      <div className="api-config-instructions">
        <div className="api-instruction-header">
          <HelpCircle size={14} />
          <span>How to obtain your free {activeProviderMeta.name} key:</span>
        </div>
        <ol className="api-instruction-steps">
          <li>
            Visit{' '}
            <a
              href={activeProviderMeta.website}
              target="_blank"
              rel="noopener noreferrer"
              className="api-inline-link"
            >
              {activeProviderMeta.name} Registration <ExternalLink size={11} />
            </a>{' '}
            and create a free developer account ({activeProviderMeta.freeLimit}).
          </li>
          <li>Copy your personal API key received via email or dashboard.</li>
          <li>
            Paste it into the field above, or save it as <code>VITE_NEWS_API_KEY=your_key</code> in your local <code>.env</code> file.
          </li>
        </ol>
      </div>
    </div>
  );
}
