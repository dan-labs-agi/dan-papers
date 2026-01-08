<div align="center">

</div>

# Dan Papers

A minimalist research publishing platform built with React, TypeScript, Vite, and Convex. Features article management, markdown rendering, AI-assisted writing, and GitHub OAuth authentication.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```
3. Set up Convex:
   ```bash
   npx convex dev
   ```
4. Run the app:
   `npm run dev`

## Environment Variables

Required variables (see `.env.example`):
- `VITE_CONVEX_URL` - Your Convex deployment URL
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GEMINI_API_KEY` - Google Gemini API key (server-side only)

## Development

```bash
# Run tests
npm run test

# Type check
npm run typecheck

# Build for production
npm run build
```

## License

MIT
