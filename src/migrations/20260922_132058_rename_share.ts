import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "memories_link_label" SET DEFAULT 'Tell Fiona what she means to you';
  ALTER TABLE "site_settings" ALTER COLUMN "share_title" SET DEFAULT 'Tell Fiona what she means to you';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "memories_link_label" SET DEFAULT 'Share a memory';
  ALTER TABLE "site_settings" ALTER COLUMN "share_title" SET DEFAULT 'Share a memory';`)
}
