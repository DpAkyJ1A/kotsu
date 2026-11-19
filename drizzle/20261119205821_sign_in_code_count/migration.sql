CREATE TABLE "sign_in_code_count" (
	"email" text PRIMARY KEY,
	"window_started_at" timestamp with time zone NOT NULL,
	"requests" integer NOT NULL
);
