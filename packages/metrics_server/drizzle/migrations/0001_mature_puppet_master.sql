DROP INDEX "idx_node_events_composite";--> statement-breakpoint
DROP INDEX "idx_node_manifests_composite";--> statement-breakpoint
DROP INDEX "idx_node_streams_composite";--> statement-breakpoint
ALTER TABLE "node_events" ADD CONSTRAINT "node_events_node_id_event_id_pk" PRIMARY KEY("node_id","event_id");--> statement-breakpoint
ALTER TABLE "node_manifests" ADD CONSTRAINT "node_manifests_node_id_manifest_cid_pk" PRIMARY KEY("node_id","manifest_cid");--> statement-breakpoint
ALTER TABLE "node_streams" ADD CONSTRAINT "node_streams_node_id_stream_id_pk" PRIMARY KEY("node_id","stream_id");