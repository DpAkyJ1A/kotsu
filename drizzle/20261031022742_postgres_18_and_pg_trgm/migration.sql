-- Ids default to uuidv7(), built into Postgres 18: on an older server the migrations stop here
SELECT uuidv7();
--> statement-breakpoint
-- Trigram indexes for typo-tolerant title search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
