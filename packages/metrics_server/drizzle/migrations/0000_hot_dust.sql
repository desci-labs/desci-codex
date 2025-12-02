CREATE TABLE "events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"stream_id" text NOT NULL,
	"event_cid" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manifests" (
	"manifest_cid" text PRIMARY KEY NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_events" (
	"node_id" text NOT NULL,
	"event_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_manifests" (
	"node_id" text NOT NULL,
	"manifest_cid" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_streams" (
	"node_id" text NOT NULL,
	"stream_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"node_id" text PRIMARY KEY NOT NULL,
	"peer_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"stream_id" text PRIMARY KEY NOT NULL,
	"stream_cid" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_stream_id_streams_stream_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("stream_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_events" ADD CONSTRAINT "node_events_node_id_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("node_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_events" ADD CONSTRAINT "node_events_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_manifests" ADD CONSTRAINT "node_manifests_node_id_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("node_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_manifests" ADD CONSTRAINT "node_manifests_manifest_cid_manifests_manifest_cid_fk" FOREIGN KEY ("manifest_cid") REFERENCES "public"."manifests"("manifest_cid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_streams" ADD CONSTRAINT "node_streams_node_id_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("node_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_streams" ADD CONSTRAINT "node_streams_stream_id_streams_stream_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("stream_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_events_stream" ON "events" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "idx_events_cid" ON "events" USING btree ("event_cid");--> statement-breakpoint
CREATE INDEX "idx_events_first_seen" ON "events" USING btree ("first_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_manifests_first_seen" ON "manifests" USING btree ("first_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_node_events_node" ON "node_events" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_node_events_event" ON "node_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_node_events_composite" ON "node_events" USING btree ("node_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_node_manifests_node" ON "node_manifests" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_node_manifests_manifest" ON "node_manifests" USING btree ("manifest_cid");--> statement-breakpoint
CREATE INDEX "idx_node_manifests_composite" ON "node_manifests" USING btree ("node_id","manifest_cid");--> statement-breakpoint
CREATE INDEX "idx_node_streams_node" ON "node_streams" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_node_streams_stream" ON "node_streams" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "idx_node_streams_composite" ON "node_streams" USING btree ("node_id","stream_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_peer" ON "nodes" USING btree ("peer_id");--> statement-breakpoint
CREATE INDEX "idx_nodes_first_seen" ON "nodes" USING btree ("first_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_nodes_last_seen" ON "nodes" USING btree ("last_seen_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_streams_cid" ON "streams" USING btree ("stream_cid");--> statement-breakpoint
CREATE INDEX "idx_streams_first_seen" ON "streams" USING btree ("first_seen_at" DESC NULLS LAST);