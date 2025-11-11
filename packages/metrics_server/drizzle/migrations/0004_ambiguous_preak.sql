ALTER TABLE "events" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "manifests" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_events" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_manifests" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "node_streams" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "environment" text NOT NULL;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "environment" text NOT NULL;