CREATE TYPE "item_kind" AS ENUM('doc', 'sheet');--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"shelf_id" uuid NOT NULL,
	"kind" "item_kind" NOT NULL,
	"title" text NOT NULL,
	"position" text collate "C" NOT NULL,
	"content" jsonb,
	"plain_text" text DEFAULT '' NOT NULL,
	"search" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('simple', "title"), 'A') || setweight(to_tsvector('simple', "plain_text"), 'B')) STORED,
	"version" integer DEFAULT 1 NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "item_title_length" CHECK (char_length("title") between 1 and 200)
);
--> statement-breakpoint
CREATE INDEX "item_user_id_shelf_id_position_idx" ON "item" ("user_id","shelf_id","position");--> statement-breakpoint
CREATE INDEX "item_search_idx" ON "item" USING gin ("search");--> statement-breakpoint
CREATE INDEX "item_title_trgm_idx" ON "item" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_shelf_id_user_id_fkey" FOREIGN KEY ("shelf_id","user_id") REFERENCES "shelf"("id","user_id") ON DELETE CASCADE;