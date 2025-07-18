

const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set.');
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  const keyBytes = encoder.encode(ENCRYPTION_KEY);
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(text: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const encoded = encoder.encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoded
  );

  const fullArray = new Uint8Array(iv.length + encrypted.byteLength);
  fullArray.set(iv, 0);
  fullArray.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...fullArray));
}

export async function decrypt(encryptedText: string): Promise<string> {
  const key = await getKey();
  const fullArray = new Uint8Array(atob(encryptedText).split('').map(char => char.charCodeAt(0)));

  const iv = fullArray.slice(0, 12);
  const encrypted = fullArray.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}
