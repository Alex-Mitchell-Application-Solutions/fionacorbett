import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "share_thanks" SET DEFAULT 'That has been saved, and Fiona will read it on her birthday. Alex looks at everything before it goes up, so it will not appear straight away — nothing has gone wrong if you do not see it yet.';
  ALTER TABLE "photographs" DROP COLUMN "featured";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "share_thanks" SET DEFAULT 'Thank you — that has been sent to Alex, and it will appear on the site once he has had a look.';
  ALTER TABLE "photographs" ADD COLUMN "featured" boolean DEFAULT false;`)
}
