CREATE TABLE "safety_acknowledgement" (
	"user_id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"acknowledged_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "safety_acknowledgement" ADD CONSTRAINT "safety_acknowledgement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;