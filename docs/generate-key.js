
const crypto = require('crypto');

function generateExtensionKey() {
    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Extract the base64 encoded public key (strip headers/newlines for manifest)
    const publicKeyString = publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, '');

    // To calculate ID:
    // 1. Get DER buffer of public key
    const publicKeyDer = crypto.createPublicKey(publicKey).export({ format: 'der', type: 'spki' });
    
    // 2. SHA256 hash
    const hash = crypto.createHash('sha256').update(publicKeyDer).digest('hex');
    
    // 3. First 32 chars (16 bytes)
    const prefix = hash.slice(0, 32);
    
    // 4. Convert hex to base26 (a-p)
    // 0-9 maps to a-j, a-f maps to k-p
    let extensionId = '';
    for (const char of prefix) {
        if (char >= '0' && char <= '9') {
            extensionId += String.fromCharCode(char.charCodeAt(0) + 49); // '0'(48) -> 'a'(97) 
        } else {
            // char is 'a'-'f'
            extensionId += String.fromCharCode(char.charCodeAt(0) + 10); // 'a'(97) -> 'k'(107)
        }
    }

    console.log('KEY_START');
    console.log(publicKeyString);
    console.log('KEY_END');
    console.log('ID_START');
    console.log(extensionId);
    console.log('ID_END');
}

generateExtensionKey();
