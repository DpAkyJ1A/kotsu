CREATE TYPE "palette_color" AS ENUM('violet', 'blue', 'amber', 'green', 'pink', 'orange', 'red', 'teal', 'slate');--> statement-breakpoint
CREATE TABLE "shelf" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" "palette_color" NOT NULL,
	"position" text collate "C" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shelf_id_user_id_unique" UNIQUE("id","user_id"),
	CONSTRAINT "shelf_name_length" CHECK (char_length("name") between 1 and 80)
);
--> statement-breakpoint
CREATE INDEX "shelf_user_id_position_idx" ON "shelf" ("user_id","position");--> statement-breakpoint
ALTER TABLE "shelf" ADD CONSTRAINT "shelf_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;