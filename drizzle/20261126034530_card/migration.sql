CREATE TYPE "card_status" AS ENUM('new', 'review', 'got_it');--> statement-breakpoint
CREATE TABLE "card" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"status" "card_status" DEFAULT 'new'::"card_status" NOT NULL,
	"removed_at" timestamp with time zone,
	"search" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('simple', "front"), 'A') || setweight(to_tsvector('simple', "back"), 'B')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "card_item_id_block_id_unique" UNIQUE("item_id","block_id")
);
--> statement-breakpoint
CREATE INDEX "card_user_id_item_id_live_idx" ON "card" ("user_id","item_id") WHERE "removed_at" is null;--> statement-breakpoint
CREATE INDEX "card_search_idx" ON "card" USING gin ("search");--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_item_id_user_id_fkey" FOREIGN KEY ("item_id","user_id") REFERENCES "item"("id","user_id") ON DELETE CASCADE;