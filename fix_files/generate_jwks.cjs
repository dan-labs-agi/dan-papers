// Generate JWKS from JWT_PRIVATE_KEY and set in Convex
const { spawnSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

// Read the .env file
const envContent = fs.readFileSync('.env', 'utf8');

// Extract the JWT_PRIVATE_KEY value
const match = envContent.match(/JWT_PRIVATE_KEY="([^"]+)"/);
if (!match) {
  console.error('JWT_PRIVATE_KEY not found in .env');
  process.exit(1);
}

// Convert escaped \n to actual newlines
const privateKeyPem = match[1].replace(/\\n/g, '\n');

// Create key object from PEM
const privateKey = crypto.createPrivateKey(privateKeyPem);
const publicKey = crypto.createPublicKey(privateKey);

// Export public key as JWK
const jwk = publicKey.export({ format: 'jwk' });

// Add required fields for JWKS
jwk.use = 'sig';
jwk.alg = 'RS256';
jwk.kid = 'convex-auth-key';

// Create JWKS structure
const jwks = JSON.stringify({ keys: [jwk] });

console.log('=== Generated JWKS ===');
console.log(jwks.substring(0, 100) + '...');
console.log('');
console.log('=== Setting JWKS in Convex ===');

// Set in Convex
const result = spawnSync('npx', ['convex', 'env', 'set', `JWKS=${jwks}`], {
  stdio: 'inherit',
  shell: false,
});

if (result.status === 0) {
  console.log('Done!');
} else {
  console.error('Failed with status', result.status);
  process.exit(1);
}
