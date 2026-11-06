import React, { createContext, useContext, useState } from 'react';
import { clearApiCache } from '../services/newsApi';
import {
  PROVIDERS,
  getStoredApiKey,
  setStoredApiKey,
  getStoredProvider,
} from '../services/apiConfig';

const ApiKeyContext = createContext(null);

const STORAGE_KEY_PROVIDER = 'newsly_api_provider';

export function ApiKeyProvider({ children }) {
  const [provider, setProviderState] = useState(() => {
    return getStoredProvider();
  });

  const [apiKey, setApiKeyState] = useState(() => {
    return getStoredApiKey(getStoredProvider());
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const getApiKeyForProvider = (targetProvider) => {
    return getStoredApiKey(targetProvider || provider);
  };

  const setApiKey = (newKey, targetProvider) => {
    const activeP = targetProvider || provider;
    const trimmed = (newKey || '').trim();
    setStoredApiKey(trimmed, activeP);
    if (activeP === provider) {
      setApiKeyState(trimmed);
    }
    clearApiCache();
  };

  const setProvider = (newProvider) => {
    if (PROVIDERS[newProvider]) {
      setProviderState(newProvider);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
      }
      // Automatically synchronize active apiKey to the selected provider's key
      const keyForNewProvider = getStoredApiKey(newProvider);
      setApiKeyState(keyForNewProvider);
      clearApiCache();
    }
  };

  const openConfigModal = () => setIsConfigModalOpen(true);
  const closeConfigModal = () => setIsConfigModalOpen(false);

  const hasApiKey = Boolean(
    (apiKey && apiKey.trim().length > 0) ||
    provider === 'gnews'
  );

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        hasApiKey,
        provider,
        providerDetails: PROVIDERS[provider] || PROVIDERS.gnews,
        setApiKey,
        setProvider,
        getApiKeyForProvider,
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
