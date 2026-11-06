import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredApiKey, setStoredApiKey, getStoredProvider } from '../services/apiConfig';

describe('Provider-Scoped API Key Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves keys separately per provider', () => {
    setStoredApiKey('gnews-custom-key-1', 'gnews');
    setStoredApiKey('guardian-dev-key-2', 'guardian');
    setStoredApiKey('newsdata-key-3', 'newsdata');

    expect(getStoredApiKey('gnews')).toBe('gnews-custom-key-1');
    expect(getStoredApiKey('guardian')).toBe('guardian-dev-key-2');
    expect(getStoredApiKey('newsdata')).toBe('newsdata-key-3');
  });

  it('retrieves empty string when a provider has no configured key', () => {
    setStoredApiKey('guardian-key', 'guardian');

    // GNews has no key configured
    expect(getStoredApiKey('gnews')).toBe('');
    // Guardian returns its key
    expect(getStoredApiKey('guardian')).toBe('guardian-key');
  });

  it('safely migrates legacy newsly_api_key only to the matching legacy provider', () => {
    // Scenario 1: Legacy key was saved for Guardian
    localStorage.setItem('newsly_api_key', 'legacy-guardian-secret');
    localStorage.setItem('newsly_api_provider', 'guardian');

    // Querying GNews must NOT receive the legacy Guardian key
    expect(getStoredApiKey('gnews')).toBe('');

    // Querying Guardian migrates it safely
    expect(getStoredApiKey('guardian')).toBe('legacy-guardian-secret');
    expect(localStorage.getItem('newsly_api_key_guardian')).toBe('legacy-guardian-secret');
    expect(localStorage.getItem('newsly_api_key')).toBeNull();
  });

  it('safely migrates legacy newsly_api_key to gnews when legacy provider was gnews', () => {
    localStorage.setItem('newsly_api_key', 'legacy-gnews-secret');
    localStorage.setItem('newsly_api_provider', 'gnews');

    expect(getStoredApiKey('guardian')).toBe('');
    expect(getStoredApiKey('gnews')).toBe('legacy-gnews-secret');
    expect(localStorage.getItem('newsly_api_key_gnews')).toBe('legacy-gnews-secret');
    expect(localStorage.getItem('newsly_api_key')).toBeNull();
  });

  it('removes provider key when setStoredApiKey is called with empty string', () => {
    setStoredApiKey('my-key', 'guardian');
    expect(getStoredApiKey('guardian')).toBe('my-key');

    setStoredApiKey('', 'guardian');
    expect(getStoredApiKey('guardian')).toBe('');
    expect(localStorage.getItem('newsly_api_key_guardian')).toBeNull();
  });
});
