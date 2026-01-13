// This script reads required secrets from .env and sets them in Convex.
// Do NOT hardcode credentials here.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function stripQuotes(value) {
    if (!value) return value;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    return value;
}

function setConvexEnv(name, value) {
    const result = spawnSync('npx', ['convex', 'env', 'set', `${name}=${value}`], {
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        throw new Error(`Failed to set ${name}`);
    }
}

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('Missing .env file at', envPath);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

try {
    const githubId = stripQuotes(envVars.AUTH_GITHUB_ID);
    const githubSecret = stripQuotes(envVars.AUTH_GITHUB_SECRET);
    const jwtPrivateKey = stripQuotes(envVars.JWT_PRIVATE_KEY);

    if (!githubId || !githubSecret) {
        throw new Error('AUTH_GITHUB_ID and AUTH_GITHUB_SECRET must be set in .env');
    }
    if (!jwtPrivateKey) {
        throw new Error('JWT_PRIVATE_KEY must be set in .env');
    }

    console.log('Setting AUTH_GITHUB_ID...');
    setConvexEnv('AUTH_GITHUB_ID', githubId);

    console.log('Setting AUTH_GITHUB_SECRET...');
    setConvexEnv('AUTH_GITHUB_SECRET', githubSecret);

    console.log('Setting JWT_PRIVATE_KEY...');
    setConvexEnv('JWT_PRIVATE_KEY', jwtPrivateKey);

    console.log('Environment variables set successfully.');
} catch (error) {
    console.error('Failed to set environment variables:', error.message);
    process.exit(1);
}
