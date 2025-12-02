CREATE TABLE "node_activity" (
	"node_id" text NOT NULL,
	"day" date NOT NULL,
	"environment" text NOT NULL,
	CONSTRAINT "node_activity_node_id_day_pk" PRIMARY KEY("node_id","day")
);
--> statement-breakpoint
ALTER TABLE "node_activity" ADD CONSTRAINT "node_activity_node_id_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("node_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_node_activity_day" ON "node_activity" USING btree ("day" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_node_activity_node" ON "node_activity" USING btree ("node_id");