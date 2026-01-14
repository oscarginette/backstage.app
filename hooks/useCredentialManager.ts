/**
 * useCredentialManager
 *
 * Hook for Credential Management API integration.
 * Provides automatic credential saving and retrieval for login forms.
 *
 * Features:
 * - Auto-suggest saved credentials on page load
 * - Save credentials after successful login
 * - Browser-native UI for credential selection
 * - Cross-device sync (if user has browser sync enabled)
 *
 * Browser Support: Chrome 51+, Edge 18+, Opera 38+
 * Falls back gracefully on unsupported browsers.
 */

'use client';

import { useEffect, useCallback } from 'react';

// Type definitions for Credential Management API (not in TypeScript by default)
interface PasswordCredential {
  id: string;
  password: string;
  name?: string;
}

declare global {
  interface Window {
    PasswordCredential: any;
  }
}

interface CredentialData {
  email: string;
  password: string;
}

interface UseCredentialManagerReturn {
  /**
   * Request saved credentials from browser.
   * Shows native browser UI to select from saved credentials.
   * Returns null if no credentials available or user cancels.
   */
  getCredentials: () => Promise<CredentialData | null>;

  /**
   * Save credentials after successful login.
   * Browser shows native UI to ask user if they want to save.
   */
  saveCredentials: (email: string, password: string) => Promise<void>;

  /**
   * Check if Credential Management API is supported in this browser.
   */
  isSupported: boolean;
}

export function useCredentialManager(): UseCredentialManagerReturn {
  const isSupported = typeof window !== 'undefined' &&
                      'credentials' in navigator &&
                      'PasswordCredential' in window;

  /**
   * Auto-request credentials on component mount.
   * This enables instant autofill without user interaction.
   */
  useEffect(() => {
    if (!isSupported) return;

    // Silently request credentials (no UI if none available)
    // TypeScript types for Credential Management API are incomplete
    navigator.credentials.get({
      // @ts-expect-error - CredentialRequestOptions types are incomplete
      password: true,
      mediation: 'silent', // Don't show UI, just autofill if available
    }).catch(() => {
      // Fail silently - user might have disabled autofill
    });
  }, [isSupported]);

  const getCredentials = useCallback(async (): Promise<CredentialData | null> => {
    if (!isSupported) {
      return null;
    }

    try {
      // TypeScript types for Credential Management API are incomplete
      const credential = await navigator.credentials.get({
        // @ts-expect-error - CredentialRequestOptions types are incomplete
        password: true,
        mediation: 'optional', // Show UI if multiple credentials
      }) as PasswordCredential | null;

      if (!credential || !credential.id || !credential.password) {
        return null;
      }

      return {
        email: credential.id,
        password: credential.password,
      };
    } catch (error) {
      console.warn('Failed to retrieve credentials:', error);
      return null;
    }
  }, [isSupported]);

  const saveCredentials = useCallback(async (
    email: string,
    password: string
  ): Promise<void> => {
    if (!isSupported) {
      return;
    }

    try {
      const credential = new window.PasswordCredential({
        id: email,
        password: password,
        name: email, // Display name in browser UI
      });

      await navigator.credentials.store(credential);
    } catch (error) {
      // Fail silently - user might have denied permission
      console.warn('Failed to save credentials:', error);
    }
  }, [isSupported]);

  return {
    getCredentials,
    saveCredentials,
    isSupported,
  };
}
