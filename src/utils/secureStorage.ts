/**
 * SECURE STORAGE SYSTEM
 * Encrypted localStorage/sessionStorage with integrity checks
 */

import { secureLogger } from './secureLogger';

// Simple encryption using Web Crypto API
class SecureStorageManager {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private encryptionKey: CryptoKey | null = null;
  
  constructor() {
    this.initializeKey();
  }

  private async initializeKey() {
    try {
      // Try to get existing key from secure storage
      const storedKey = sessionStorage.getItem('__app_key');
      
      if (storedKey) {
        // Import existing key
        const keyData = new Uint8Array(JSON.parse(storedKey));
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: this.algorithm },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: this.algorithm, length: this.keyLength },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Store key for session
        const keyData = await crypto.subtle.exportKey('raw', this.encryptionKey);
        sessionStorage.setItem('__app_key', JSON.stringify(Array.from(new Uint8Array(keyData))));
      }
    } catch (error) {
      secureLogger.error('Failed to initialize encryption key', { error });
      // Fallback to basic obfuscation if crypto is not available
      this.encryptionKey = null;
    }
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey || !crypto.subtle) {
      // Fallback: Basic base64 encoding (not secure but better than plain text)
      return btoa(data);
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        this.encryptionKey,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      secureLogger.error('Encryption failed', { error });
      return btoa(data); // Fallback
    }
  }

  private async decrypt(encryptedData: string): Promise<string | null> {
    if (!this.encryptionKey || !crypto.subtle) {
      // Fallback: Basic base64 decoding
      try {
        return atob(encryptedData);
      } catch {
        return null;
      }
    }

    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        this.encryptionKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      secureLogger.error('Decryption failed', { error });
      // Try fallback decoding
      try {
        return atob(encryptedData);
      } catch {
        return null;
      }
    }
  }

  // Add integrity check with timestamp
  private createDataPackage(data: any): string {
    return JSON.stringify({
      data,
      timestamp: Date.now(),
      checksum: this.simpleChecksum(JSON.stringify(data))
    });
  }

  private verifyDataPackage(packageStr: string): { data: any; isValid: boolean } {
    try {
      const pkg = JSON.parse(packageStr);
      const expectedChecksum = this.simpleChecksum(JSON.stringify(pkg.data));
      const isValid = pkg.checksum === expectedChecksum;
      
      // Check age (expire data older than 7 days)
      const isRecent = Date.now() - pkg.timestamp < 7 * 24 * 60 * 60 * 1000;
      
      return { data: pkg.data, isValid: isValid && isRecent };
    } catch {
      return { data: null, isValid: false };
    }
  }

  private simpleChecksum(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Public API
  async setItem(key: string, value: any, useSessionStorage = false): Promise<boolean> {
    try {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      const dataPackage = this.createDataPackage(value);
      const encrypted = await this.encrypt(dataPackage);
      
      const storage = useSessionStorage ? sessionStorage : localStorage;
      storage.setItem(`secure_${sanitizedKey}`, encrypted);
      
      secureLogger.debug('Secure storage set', { key: sanitizedKey, useSessionStorage });
      return true;
    } catch (error) {
      secureLogger.error('Failed to set secure storage', { key, error });
      return false;
    }
  }

  async getItem(key: string, useSessionStorage = false): Promise<any> {
    try {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const encrypted = storage.getItem(`secure_${sanitizedKey}`);
      
      if (!encrypted) {
        return null;
      }

      const decrypted = await this.decrypt(encrypted);
      if (!decrypted) {
        secureLogger.warn('Failed to decrypt storage data', { key: sanitizedKey });
        return null;
      }

      const { data, isValid } = this.verifyDataPackage(decrypted);
      if (!isValid) {
        secureLogger.warn('Invalid or expired storage data', { key: sanitizedKey });
        this.removeItem(key, useSessionStorage);
        return null;
      }

      return data;
    } catch (error) {
      secureLogger.error('Failed to get secure storage', { key, error });
      return null;
    }
  }

  removeItem(key: string, useSessionStorage = false): void {
    try {
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      const storage = useSessionStorage ? sessionStorage : localStorage;
      storage.removeItem(`secure_${sanitizedKey}`);
      secureLogger.debug('Secure storage removed', { key: sanitizedKey });
    } catch (error) {
      secureLogger.error('Failed to remove secure storage', { key, error });
    }
  }

  clear(useSessionStorage = false): void {
    try {
      const storage = useSessionStorage ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith('secure_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key));
      secureLogger.debug('Secure storage cleared', { count: keysToRemove.length });
    } catch (error) {
      secureLogger.error('Failed to clear secure storage', { error });
    }
  }

  // Migration helper for existing unencrypted data
  async migrateUnencryptedData(keys: string[]): Promise<void> {
    for (const key of keys) {
      try {
        const oldData = localStorage.getItem(key);
        if (oldData) {
          const parsedData = JSON.parse(oldData);
          await this.setItem(key, parsedData);
          localStorage.removeItem(key);
          secureLogger.info('Migrated unencrypted data', { key });
        }
      } catch (error) {
        secureLogger.error('Failed to migrate data', { key, error });
      }
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageManager();

// Legacy storage adapter for easy migration
export const legacyStorageAdapter = {
  setItem: (key: string, value: string) => secureStorage.setItem(key, value),
  getItem: (key: string) => secureStorage.getItem(key),
  removeItem: (key: string) => secureStorage.removeItem(key),
  clear: () => secureStorage.clear(),
};