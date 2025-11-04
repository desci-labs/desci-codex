ALTER TABLE "nodes" RENAME COLUMN "peer_id" TO "ceramic_peer_id";--> statement-breakpoint
DROP INDEX "idx_nodes_peer";--> statement-breakpoint
CREATE INDEX "idx_nodes_peer" ON "nodes" USING btree ("ceramic_peer_id");