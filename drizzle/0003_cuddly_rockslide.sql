CREATE TABLE "mobile_auth_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"code_challenge" text NOT NULL,
	"state" text NOT NULL,
	"user_id" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_auth_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "mobile_auth_codes" ADD CONSTRAINT "mobile_auth_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mobile_auth_codes_user_id_idx" ON "mobile_auth_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mobile_auth_codes_expires_at_idx" ON "mobile_auth_codes" USING btree ("expires_at");