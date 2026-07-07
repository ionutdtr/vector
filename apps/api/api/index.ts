import { handle } from 'hono/vercel';
import { assertRuntimeConfig } from '../src/config';
import app from '../src/app';

// Vercel Functions entry (Node.js / Fluid Compute). The vercel.json rewrite
// routes every request here; Hono dispatches by path.
export const config = { runtime: 'nodejs' };

// Validate secrets at function init — a misconfigured production deploy (missing
// DATABASE_URL / weak JWT_SECRET) fails loudly rather than serving forgeable tokens.
assertRuntimeConfig();

export default handle(app);
