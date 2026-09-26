import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "memory_videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "memories" ADD COLUMN "video_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "memory_videos_id" integer;
  CREATE INDEX "memory_videos_updated_at_idx" ON "memory_videos" USING btree ("updated_at");
  CREATE INDEX "memory_videos_created_at_idx" ON "memory_videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "memory_videos_filename_idx" ON "memory_videos" USING btree ("filename");
  ALTER TABLE "memories" ADD CONSTRAINT "memories_video_id_memory_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."memory_videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_memory_videos_fk" FOREIGN KEY ("memory_videos_id") REFERENCES "public"."memory_videos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "memories_video_idx" ON "memories" USING btree ("video_id");
  CREATE INDEX "payload_locked_documents_rels_memory_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("memory_videos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "memory_videos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "memory_videos" CASCADE;
  ALTER TABLE "memories" DROP CONSTRAINT "memories_video_id_memory_videos_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_memory_videos_fk";
  
  DROP INDEX "memories_video_idx";
  DROP INDEX "payload_locked_documents_rels_memory_videos_id_idx";
  ALTER TABLE "memories" DROP COLUMN "video_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "memory_videos_id";`)
}
