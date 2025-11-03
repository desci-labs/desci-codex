import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Tracks individual Codex nodes in the network.
 * Each node represents a unique participant that can store and serve data.
 * Nodes are identified by a unique nodeId and their libp2p peerId.
 */
export const nodes = pgTable(
  "nodes",
  {
    nodeId: text("node_id").primaryKey(),
    peerId: text("peer_id").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_nodes_peer").on(table.peerId),
    index("idx_nodes_first_seen").on(table.firstSeenAt.desc()),
    index("idx_nodes_last_seen").on(table.lastSeenAt.desc()),
  ],
);

/**
 * Stores content manifests that describe data structures in the network.
 * Manifests are content-addressed by their CID (Content Identifier) and
 * define how data blocks are organized and can be retrieved.
 */
export const manifests = pgTable(
  "manifests",
  {
    manifestCid: text("manifest_cid").primaryKey(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_manifests_first_seen").on(table.firstSeenAt.desc())],
);

/**
 * Represents data streams in the Codex network.
 * Streams are sequences of related data that can be consumed or produced by nodes.
 * Each stream is identified by a unique streamId and content-addressed by streamCid.
 */
export const streams = pgTable(
  "streams",
  {
    streamId: text("stream_id").primaryKey(),
    streamCid: text("stream_cid").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_streams_cid").on(table.streamCid),
    index("idx_streams_first_seen").on(table.firstSeenAt.desc()),
  ],
);

/**
 * Records individual events that occur within streams.
 * Events are the atomic units of data within a stream, each with its own CID.
 * Events are linked to their parent stream and tracked for network observability.
 */
export const events = pgTable(
  "events",
  {
    eventId: text("event_id").primaryKey(),
    streamId: text("stream_id")
      .notNull()
      .references(() => streams.streamId),
    eventCid: text("event_cid").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_events_stream").on(table.streamId),
    index("idx_events_cid").on(table.eventCid),
    index("idx_events_first_seen").on(table.firstSeenAt.desc()),
  ],
);

/**
 * Junction table linking nodes to the manifests they store or serve.
 * Tracks which nodes have which manifests, enabling discovery of where
 * specific content can be retrieved from in the network.
 */
export const nodeManifests = pgTable(
  "node_manifests",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => nodes.nodeId),
    manifestCid: text("manifest_cid")
      .notNull()
      .references(() => manifests.manifestCid),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_node_manifests_node").on(table.nodeId),
    index("idx_node_manifests_manifest").on(table.manifestCid),
    index("idx_node_manifests_composite").on(table.nodeId, table.manifestCid),
  ],
);

/**
 * Junction table linking nodes to streams they participate in.
 * Tracks which nodes are producing or consuming specific streams,
 * enabling stream discovery and routing in the network.
 */
export const nodeStreams = pgTable(
  "node_streams",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => nodes.nodeId),
    streamId: text("stream_id")
      .notNull()
      .references(() => streams.streamId),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_node_streams_node").on(table.nodeId),
    index("idx_node_streams_stream").on(table.streamId),
    index("idx_node_streams_composite").on(table.nodeId, table.streamId),
  ],
);

/**
 * Junction table linking nodes to specific events they have processed.
 * Provides fine-grained tracking of which nodes have seen or handled
 * particular events, useful for monitoring event propagation.
 */
export const nodeEvents = pgTable(
  "node_events",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => nodes.nodeId),
    eventId: text("event_id")
      .notNull()
      .references(() => events.eventId),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_node_events_node").on(table.nodeId),
    index("idx_node_events_event").on(table.eventId),
    index("idx_node_events_composite").on(table.nodeId, table.eventId),
  ],
);

/**
 * Relations definitions for Drizzle ORM query API.
 * These define the relationships between tables for use with Drizzle's
 * relational query builder, enabling nested queries and joins.
 */

// Node relations - a node can have many manifests, streams, and events
export const nodesRelations = relations(nodes, ({ many }) => ({
  manifests: many(nodeManifests),
  streams: many(nodeStreams),
  events: many(nodeEvents),
}));

// Manifest relations - a manifest can be stored by many nodes
export const manifestsRelations = relations(manifests, ({ many }) => ({
  nodes: many(nodeManifests),
}));

// Stream relations - a stream has many events and can be accessed by many nodes
export const streamsRelations = relations(streams, ({ many }) => ({
  events: many(events),
  nodes: many(nodeStreams),
}));

// Event relations - an event belongs to one stream and can be processed by many nodes
export const eventsRelations = relations(events, ({ one, many }) => ({
  stream: one(streams, {
    fields: [events.streamId],
    references: [streams.streamId],
  }),
  nodes: many(nodeEvents),
}));

// NodeManifests junction table relations
export const nodeManifestsRelations = relations(nodeManifests, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeManifests.nodeId],
    references: [nodes.nodeId],
  }),
  manifest: one(manifests, {
    fields: [nodeManifests.manifestCid],
    references: [manifests.manifestCid],
  }),
}));

// NodeStreams junction table relations
export const nodeStreamsRelations = relations(nodeStreams, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeStreams.nodeId],
    references: [nodes.nodeId],
  }),
  stream: one(streams, {
    fields: [nodeStreams.streamId],
    references: [streams.streamId],
  }),
}));

// NodeEvents junction table relations
export const nodeEventsRelations = relations(nodeEvents, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeEvents.nodeId],
    references: [nodes.nodeId],
  }),
  event: one(events, {
    fields: [nodeEvents.eventId],
    references: [events.eventId],
  }),
}));
