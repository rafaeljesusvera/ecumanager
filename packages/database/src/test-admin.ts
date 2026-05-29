import 'dotenv/config';
import { db, schema } from '@equmanager/database';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('[1] count clubs');
  const a = await db.select({ n: sql<number>`count(*)::int` }).from(schema.clubs);
  console.log('   ', a);

  console.log('[2] monthly cumulative clubs');
  const r = await db.execute(sql`
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*)::int as n
    from clubs group by 1 order by 1 asc
  `);
  console.log('   type:', typeof r, 'isArray:', Array.isArray(r));
  console.log('   ', r);

  console.log('[3] federation stats');
  const f = await db.execute(sql`
    select
      (select count(*)::int from clubs where directory_club_id is not null) as claimed,
      (select count(*)::int from directory_clubs) as total
  `);
  console.log('   ', f);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
