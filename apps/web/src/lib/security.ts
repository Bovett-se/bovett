/**
 * Sanitizes a URL to prevent XSS attacks (e.g., javascript: URLs).
 * If the URL is potentially dangerous, it returns '#' or a safe fallback.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  const trimmedUrl = url.trim();

  // List of dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];

  const isDangerous = dangerousProtocols.some((protocol) =>
    trimmedUrl.toLowerCase().startsWith(protocol)
  );

  if (isDangerous) {
    // eslint-disable-next-line no-console
    console.warn('Dangerous URL detected and sanitized:', trimmedUrl);
    return '#';
  }

  return trimmedUrl;
}

/**
 * Encrypts a string using a random key (AES-GCM).
 * Returns { encryptedData: string, key: string } where both are base64 encoded.
 */
export async function encryptData(data: string): Promise<{ encryptedData: string; key: string }> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt'
  ]);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);

  const exportedKey = await crypto.subtle.exportKey('raw', key);

  // Combine IV and Encrypted data for storage
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return {
    encryptedData: btoa(String.fromCharCode(...combined)),
    key: btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
  };
}

/**
 * Decrypts a base64 encoded string using a base64 encoded key.
 */
export async function decryptData(encryptedBase64: string, keyBase64: string): Promise<string> {
  const keyBuffer = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const key = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, [
    'decrypt'
  ]);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

  return new TextDecoder().decode(decrypted);
}
