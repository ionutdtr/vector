import { handle } from 'hono/vercel';
import app from '../src/app';

// Vercel Functions entry (Node.js / Fluid Compute). The vercel.json rewrite
// routes every request here; Hono dispatches by path.
export const config = { runtime: 'nodejs' };

export default handle(app);
