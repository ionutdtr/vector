import 'dotenv/config';
import { db, pool, profiles } from '@vector/db';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../services/auth';

/** Attaches login credentials to the pre-seeded demo profile. Run once. */
const DEMO_ID = '00000000-0000-0000-0000-000000000001';
const EMAIL = process.env.DEMO_EMAIL ?? 'office@divex.ro';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'vector1234';

async function main() {
  const passwordHash = await hashPassword(PASSWORD);
  const [row] = await db
    .update(profiles)
    .set({
      email: EMAIL,
      passwordHash,
      onboardedAt: new Date(),
      emailVerifiedAt: new Date(),
    })
    .where(eq(profiles.id, DEMO_ID))
    .returning();
  if (!row) throw new Error('Demo profile not found');
  console.log(`Demo login set: ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
