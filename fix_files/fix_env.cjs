// This script generates a new JWT private key and adds it to .env
// Do NOT hardcode any credentials here
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let envContent = '';

// Read existing .env if it exists
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// Generate new JWT key only if not present
if (!envContent.includes('JWT_PRIVATE_KEY')) {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    envContent += `\nJWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"\n`;
    fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
    console.log('Added JWT_PRIVATE_KEY to .env');
} else {
    console.log('.env already has JWT_PRIVATE_KEY');
}
