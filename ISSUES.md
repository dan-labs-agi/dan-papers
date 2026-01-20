# Known Issues

## Production Deployment Out of Sync
**Date:** 2024-01-20
**Severity:** Critical (affects live PDF upload)

### Description
The production Convex deployment (`beaming-starfish-640`) is currently running an outdated version of the backend functions (`ai.js`). 
- **Current State:** The production schema enforces `rawText` as a required argument for `structureArticle`.
- **Desired State:** The codebase has been updated to make `rawText` optional (supporting `fileData` for PDFs), but this schema change has **not** been applied to production due to permission restrictions on the CI/Agent environment.

### Impact
Uploading PDFs on the live site (`pages.danlab.dev`) fails with `ArgumentValidationError: Object is missing the required field 'rawText'`.

### Resolution Required
A project admin with deployment permissions must run the following command locally:
```bash
npx convex deploy
```
*Ensure `CONVEX_DEPLOYMENT` targets the production environment.*
