

// Simple wrapper for encryption. 
// Since we are in an extension, we can generate a key and store it in local storage (users can't easily see it if we don't expose it).
// But for true security "users can't understand", we need encryption.

const ALGORITHM = { name: 'AES-GCM', length: 256 };

async function getKey(): Promise<CryptoKey> {
    const storedKey = await chrome.storage.local.get('encryption_key');

    // Check for valid key format (must be object/JWK, not string/encrypted blob)
    if (storedKey.encryption_key && typeof storedKey.encryption_key === 'object') {
        try {
            return await crypto.subtle.importKey(
                'jwk',
                storedKey.encryption_key,
                ALGORITHM,
                true,
                ['encrypt', 'decrypt']
            );
        } catch (e) {
            console.error('[SecureStorage] Failed to import key - likely corrupted:', e);
            // Fall through to regeneration
        }
    } else if (storedKey.encryption_key) {
        console.warn('[SecureStorage] Found corrupted/invalid encryption key format. Resetting.');
        // It's likely a string (overwritten by bug). Remove it.
        await chrome.storage.local.remove('encryption_key');
    }

    const key = await crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt']);
    const exported = await crypto.subtle.exportKey('jwk', key);
    await chrome.storage.local.set({ encryption_key: exported });
    return key;
}

export const secureStorage = {
    async set(items: Record<string, any>) {
        const key = await getKey();
        const encryptedItems: Record<string, any> = {};

        for (const [k, v] of Object.entries(items)) {
            // CRITICAL: Never authorize overwriting the master key via this method
            if (k === 'encryption_key') {
                console.warn('[SecureStorage] Attempted to overwrite encryption_key via set(). Skipped.');
                continue;
            }

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(JSON.stringify(v));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoded
            );

            // Store as: iv + ciphertext (base64)
            const buffer = new Uint8Array(iv.length + encrypted.byteLength);
            buffer.set(iv);
            buffer.set(new Uint8Array(encrypted), iv.length);

            // Convert to base64 string
            const base64 = btoa(String.fromCharCode(...buffer));
            encryptedItems[k] = base64;
        }

        // ACTUALLY write to storage
        return chrome.storage.local.set(encryptedItems);
    },

    async get(keys: string | string[] | null) {
        // Logic: Read from storage, try to decrypt. If fail (or not encrypted), return original?
        // For this feature, we assume EVERYTHING accessed via secureStorage is encrypted.
        const raw = await chrome.storage.local.get(keys);
        const key = await getKey();
        const decrypted: Record<string, any> = {};

        for (const [k, v] of Object.entries(raw)) {
            if (typeof v !== 'string') {
                decrypted[k] = v; // Not encrypted or legacy
                continue;
            }

            try {
                // Decode base64
                const str = atob(v);
                const buffer = new Uint8Array(str.length);
                for (let i = 0; i < str.length; i++) buffer[i] = str.charCodeAt(i);

                const iv = buffer.slice(0, 12);
                const data = buffer.slice(12);

                const decryptedBuf = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv },
                    key,
                    data
                );

                decrypted[k] = JSON.parse(new TextDecoder().decode(decryptedBuf));
            } catch (e) {
                // Fallback: likely not encrypted yet or invalid -> Return NULL to be safe
                // Returning the raw string 'v' is dangerous if the caller expects an object.
                // If it's a corrupted/non-decryptable value, better to treat as missing.
                console.warn(`[SecureStorage] Failed to decrypt key "${k}". Treating as missing.`);
                decrypted[k] = undefined;
            }
        }
        return decrypted;
    },

    async remove(keys: string | string[]) {
        return chrome.storage.local.remove(keys);
    },

    async clear() {
        return chrome.storage.local.clear();
    }
};
