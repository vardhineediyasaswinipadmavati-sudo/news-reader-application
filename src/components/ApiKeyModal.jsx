import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import { PROVIDERS } from '../services/apiConfig';
import { useToast } from './Toast';

export default function ApiKeyModal() {
  const {
    apiKey,
    provider,
    setApiKey,
    setProvider,
    getApiKeyForProvider,
    isConfigModalOpen,
    closeConfigModal,
  } = useApiKey();

  const { addToast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState(provider || 'gnews');
  const [inputKey, setInputKey] = useState(() => {
    const initialKey = getApiKeyForProvider ? getApiKeyForProvider(provider || 'gnews') : apiKey;
    return initialKey && initialKey !== 'test' ? initialKey : '';
  });
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isConfigModalOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();

    if (selectedProvider === 'guardian' && cleanKey.toLowerCase() === 'test') {
      setErrorMessage('The Guardian Content API requires your personal developer key. Generic "test" is not supported.');
      return;
    }

    setProvider(selectedProvider);
    setApiKey(cleanKey, selectedProvider);
    setIsSaved(true);
    addToast('API settings saved successfully!', 'success');
    setTimeout(() => {
      setIsSaved(false);
      closeConfigModal();
    }, 600);
  };

  const activeProviderMeta = PROVIDERS[selectedProvider] || PROVIDERS.gnews;

  return (
    <div
      className="modal-backdrop"
      onClick={closeConfigModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
    >
      <div className="modal-dialog animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key size={20} color="var(--accent)" />
            <h2 id="api-modal-title" className="modal-title">API Configuration</h2>
          </div>
          <button
            type="button"
            className="action-btn-mini"
            onClick={closeConfigModal}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              NEWSLY delivers genuine real-time journalism directly from accredited news REST APIs.
              Configure your credentials below or save in your local <code>.env</code> file.
            </p>

            <div className="form-group">
              <label htmlFor="provider-select" className="form-label">
                News Provider
              </label>
              <select
                id="provider-select"
                className="form-select"
                value={selectedProvider}
                onChange={(e) => {
                  const nextP = e.target.value;
                  setSelectedProvider(nextP);
                  const existingKey = getApiKeyForProvider ? getApiKeyForProvider(nextP) : '';
                  setInputKey(existingKey && existingKey !== 'test' ? existingKey : '');
                  setErrorMessage('');
                }}
              >
                <option value="gnews">GNews.io (Global & Regional Headlines)</option>
                <option value="guardian">The Guardian Open Platform (Independent Journalism)</option>
                <option value="newsdata">NewsData.io (Worldwide Aggregator)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="api-key-input" className="form-label">
                {activeProviderMeta.name} Key
              </label>
              <input
                id="api-key-input"
                type="text"
                className="form-input"
                placeholder="Paste your personal API key here..."
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </div>

            {errorMessage && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--accent)', padding: '0.4rem 0' }}>
                {errorMessage}
              </div>
            )}

            {/* Quick Helper / Instructions */}
            <div className="info-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>
                  How to obtain a free {activeProviderMeta.name} key:
                </strong>
                <a
                  href={activeProviderMeta.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontWeight: 600 }}
                >
                  Register Free Key <ExternalLink size={12} />
                </a>
              </div>
              <ol>
                <li>Register for a free account at {activeProviderMeta.name} ({activeProviderMeta.freeLimit}).</li>
                <li>Copy your personal API key from your registration confirmation or dashboard.</li>
                <li>Paste it above, or add <code>VITE_NEWS_API_KEY=your_key</code> in your <code>.env</code> file.</li>
              </ol>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={closeConfigModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-accent"
            >
              {isSaved ? <><Check size={16} /> Saved</> : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
