// Fix JWT_PRIVATE_KEY by converting \n to actual newlines
const { spawnSync } = require('child_process');
const fs = require('fs');

// Read the .env file
const envContent = fs.readFileSync('.env', 'utf8');

// Extract the JWT_PRIVATE_KEY value (it's quoted and has escaped \n)
const match = envContent.match(/JWT_PRIVATE_KEY="([^"]+)"/);
if (!match) {
  console.error('JWT_PRIVATE_KEY not found in .env');
  process.exit(1);
}

// The value has literal backslash-n sequences that need to become actual newlines
const rawValue = match[1];
const fixedValue = rawValue.replace(/\\n/g, '\n');

console.log('=== Fixed key preview (first 100 chars) ===');
console.log(fixedValue.substring(0, 100));
console.log('...');
console.log('=== Setting in Convex ===');

// Use spawnSync with the value passed properly
const result = spawnSync('npx', ['convex', 'env', 'set', `JWT_PRIVATE_KEY=${fixedValue}`], {
  stdio: 'inherit',
  shell: false,
});

if (result.status === 0) {
  console.log('Done!');
} else {
  console.error('Failed with status', result.status);
}
