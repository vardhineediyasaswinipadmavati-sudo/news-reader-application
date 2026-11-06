import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearApiCache } from '../services/newsApi';
import { PROVIDERS } from '../services/apiConfig';

const ApiKeyContext = createContext(null);

const STORAGE_KEY_KEY = 'newsly_api_key';
const STORAGE_KEY_PROVIDER = 'newsly_api_provider';

export function ApiKeyProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
    const envKey = import.meta.env.VITE_NEWS_API_KEY;
    return (envKey && envKey.trim()) ? envKey.trim() : '';
  });

  const [provider, setProviderState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_PROVIDER);
      if (stored && PROVIDERS[stored]) return stored;
    }
    const envProvider = import.meta.env.VITE_NEWS_API_PROVIDER;
    return (envProvider && PROVIDERS[envProvider]) ? envProvider : 'gnews';
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const setApiKey = (newKey) => {
    const trimmed = (newKey || '').trim();
    setApiKeyState(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY_KEY);
      }
    }
    clearApiCache();
  };

  const setProvider = (newProvider) => {
    if (PROVIDERS[newProvider]) {
      setProviderState(newProvider);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
      }
      clearApiCache();
    }
  };

  const openConfigModal = () => setIsConfigModalOpen(true);
  const closeConfigModal = () => setIsConfigModalOpen(false);

  const hasApiKey = Boolean(apiKey && apiKey.trim().length > 0);

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        hasApiKey,
        provider,
        providerDetails: PROVIDERS[provider] || PROVIDERS.gnews,
        setApiKey,
        setProvider,
        isConfigModalOpen,
        openConfigModal,
        closeConfigModal,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
