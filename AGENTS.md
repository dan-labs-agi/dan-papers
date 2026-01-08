# AGENTS.md

This document provides guidelines and commands for AI agents working on this codebase.

## Project Overview

Dan Papers is a minimalist research publishing platform built with React 19, TypeScript, Vite, and Convex. It features article management, markdown rendering, AI-assisted writing, and GitHub OAuth authentication through Convex Auth.

## Build Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run tests
npm run test

# Run tests in UI mode
npm run test:ui

# Run tests once
npm run test:run

# Type check
npm run typecheck
```

**Note:** The dev server runs on port 3000 by default (configured in vite.config.ts).

## Code Style Guidelines

### TypeScript
- Use explicit types for function parameters and return values
- Interface names: `PascalCase` (e.g., `Article`, `User`)
- Type aliases: `PascalCase`
- Local variables and functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` or `camelCase` for simple values
- Prefer interfaces over type aliases for object shapes

### React Components
- Functional components with TypeScript: `const ComponentName: React.FC<Props> = () => {}`
- Prop interfaces: `interface ComponentNameProps { ... }`
- Use `.tsx` extension for all React component files
- Components go in `components/` directory
- Keep components focused - single responsibility principle

### Imports
- React core: `import React from 'react';`
- Named imports: `import { SpecificThing } from 'module';`
- Path aliases: Use `@/` prefix (e.g., `import types from '@/types'`)
- Vite configured with `@/` alias pointing to project root
- Convex: `import { useQuery, useMutation } from 'convex/react'`

### File Organization
```
/home/sodan/Desktop/x/rxx/dan-papers
├── convex/               # Convex backend
│   ├── auth.ts          # Auth configuration with GitHub OAuth
│   ├── schema.ts        # Database schema
│   ├── http.js         # HTTP routes for auth
│   └── functions/      # Serverless functions
│       ├── articles.js   # Article CRUD operations
│       ├── users.js      # User management
│       └── ai.js        # AI API wrappers
├── components/          # React components (.tsx)
├── src/
│   ├── context/         # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/           # Utilities and clients
│   │   ├── convex.ts   # Convex client initialization
│   │   └── api.ts     # API helpers
│   └── test/          # Test files
│       └── setup.ts
├── App.tsx            # Root component with routing
├── index.tsx          # Entry point
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

### Error Handling
- Use `throw new Error("...")` for unrecoverable errors
- Always check for null/undefined before accessing properties
- Guard clauses for optional values: `if (!value) return early;`
- Wrap async operations in try/catch blocks

### Naming Conventions
- Components: `PascalCase` (e.g., `ArticlePage`, `Navbar`)
- Files: `kebab-case` for non-components, `PascalCase.tsx` for components
- Hooks: `camelCase` starting with `use` (e.g., `useAuth`)
- Convex functions: `camelCase` for functions, `PascalCase` for directories
- CSS classes: `kebab-case` (handled by Tailwind classes)

### Styling
- Use inline Tailwind CSS classes for all styling
- No custom CSS files or styled-components
- Follow pattern: `className="flex items-center gap-4 p-4 ..."`

### Convex Backend
- Schema defined in `convex/schema.ts`
- Functions are serverless and auto-deployed
- Use `useQuery` for data fetching (reads)
- Use `useMutation` for data modification (writes)
- All environment variables are server-side only

### Authentication
- GitHub OAuth via Convex Auth
- Auth configuration in `convex/auth.ts`
- Use `useAuth` hook from `src/context/AuthContext.tsx`
- Protected routes check `user` state

### API Services
- AI API calls in `convex/functions/ai.js`
- Environment variables: `GEMINI_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- All API calls are server-side through Convex functions

### Routing
- Use `react-router-dom` v7
- HashRouter configured in App.tsx (for GitHub Pages compatibility)
- Routes defined in App.tsx with `Routes` and `Route` components

### Testing
- Vitest with React Testing Library
- Test files: `*.test.{ts,tsx}`
- Run tests with `npm run test`
- Test setup in `src/test/setup.ts`
- Add tests for new features and critical user flows

### Git Workflow
- Commits should be descriptive and follow conventional commits
- No force pushes to main
- Create feature branches for new functionality
- CI runs on push/PR: typecheck, build

### Key Files
- `vite.config.ts:1` - Vite config with path aliases
- `tsconfig.json:1` - TypeScript configuration
- `convex/schema.ts:1` - Database schema
- `convex/auth.ts:1` - Auth configuration
- `App.tsx:1` - Main routing configuration
- `src/lib/convex.ts:1` - Convex client setup
- `src/context/AuthContext.tsx:1` - Auth context
