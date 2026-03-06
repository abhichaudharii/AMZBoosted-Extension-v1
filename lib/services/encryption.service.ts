/**
 * Encryption Service
 * Handles encryption/decryption of user data for secure export/import
 * Binds data to specific user ID to prevent cross-account imports
 */

import { User } from '@/lib/types/auth';

class EncryptionService {
    private readonly APP_SECRET = 'AMZ_BOOSTED_SECURE_EXPORT_V1'; // Static salt

    /**
     * Generic encrypt for local storage
     */
    async encryptData(data: any, contextId: string = 'system'): Promise<string> {
        try {
            const payload = {
                id: contextId,
                timestamp: Date.now(),
                version: '1.0',
                data: data
            };

            const jsonString = JSON.stringify(payload);
            const encoded = btoa(encodeURIComponent(jsonString));

            const signature = await this.generateSignature(encoded, contextId);

            return JSON.stringify({
                content: encoded,
                signature: signature
            });
        } catch (error) {
            console.error('[Encryption] Data encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Generic decrypt for local storage
     */
    async decryptData(encryptedString: string, contextId: string = 'system'): Promise<any> {
        try {
            let parsed;
            try {
                parsed = JSON.parse(encryptedString);
            } catch (e) {
                return null; // Return null if not encrypted/invalid JSON
            }

            if (!parsed.content || !parsed.signature) {
                return null;
            }

            // Verify signature
            const expectedSignature = await this.generateSignature(parsed.content, contextId);
            if (parsed.signature !== expectedSignature) {
                console.error('[Encryption] Signature mismatch - data tampered');
                throw new Error('Data integrity check failed');
            }

            // Decode
            const jsonString = decodeURIComponent(atob(parsed.content));
            const payload = JSON.parse(jsonString);

            // Verify context match
            if (payload.id !== contextId) {
                throw new Error(`Context Mismatch: Data belongs to ${payload.id}, expected ${contextId}`);
            }

            return payload.data;
        } catch (error) {
            console.error('[Encryption] Data decryption failed:', error);
            throw error;
        }
    }

    /**
     * Encrypt data with user-specific keys
     */
    async encrypt(data: any, user: User): Promise<string> {
        return this.encryptData(data, user.id || user.email);
    }


    /**
     * Decrypt data and verify user ownership
     */
    async decrypt(encryptedString: string, currentUser: User): Promise<any> {
        try {
            let parsed;
            try {
                parsed = JSON.parse(encryptedString);
            } catch (e) {
                throw new Error('Invalid file format');
            }

            if (!parsed.content || !parsed.signature) {
                throw new Error('Invalid file format: missing content or signature');
            }

            // Verify signature
            const expectedSignature = await this.generateSignature(parsed.content, currentUser.id || currentUser.email || '');
            if (parsed.signature !== expectedSignature) {
                throw new Error('Security Check Failed: This data belongs to a different account or has been tampered with.');
            }

            // Decode content
            const jsonString = decodeURIComponent(atob(parsed.content));
            const payload = JSON.parse(jsonString);

            // Verify User ID match (double check)
            const currentUserId = currentUser.id;
            const currentUserEmail = currentUser.email;

            // We check if the payload user ID matches EITHER the current ID OR the current Email.
            // This prevents issues where inconsistent ID usage (email vs uuid) blocks valid restore.
            // Note: encryptData stores the ID in payload.id
            if (payload.id !== currentUserId && payload.id !== currentUserEmail) {
                console.error(`[Encryption] ID Mismatch. Backup ID: ${payload.id}, Current ID: ${currentUserId}, Current Email: ${currentUserEmail}`);
                throw new Error(`Account Mismatch: This backup belongs to ${payload.id}, but you are logged in as ${currentUserId || currentUserEmail}.`);
            }

            return payload.data;
        } catch (error) {
            console.error('[Encryption] Decryption failed:', error);
            throw error;
        }
    }

    /**
     * Generate a simple HMAC-like signature
     */
    private async generateSignature(content: string, userId: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(content + userId + this.APP_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

export const encryptionService = new EncryptionService();
