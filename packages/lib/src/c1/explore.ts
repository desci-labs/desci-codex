import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { instantQuery } from "./queries.js";
import { StreamID } from "@ceramic-sdk/identifiers";
import type { ResearchObject } from "../types.js";
import { allResearchObjectsQuery, modelHistoryQuery } from "./sql.js";

export type RawResearchObject = {
  stream_cid: string;
  controller: string;
  state: string;
};

type C1ResearchObject = {
  owner: string;
  streamId: string;
  state: ResearchObject;
};

export type HistoricalState = {
  streamId: string;
  controller: string;
  state: ResearchObject;
  event_height: number;
};

export const listResearchObjects = async (
  client: FlightSqlClient,
  model?: StreamID,
): Promise<C1ResearchObject[]> => {
  const raw = await instantQuery<RawResearchObject>(
    client,
    allResearchObjectsQuery(model),
  );

  return raw.map((row) => ({
    owner: row.controller,
    streamId: new StreamID("MID", row.stream_cid).toString(),
    state: JSON.parse(row.state),
  }));
};

export const listResearchObjectsWithHistory = async (
  client: FlightSqlClient,
  model: StreamID,
): Promise<Record<string, HistoricalState[]>> => {
  const raw = await instantQuery<RawResearchObject & { event_height: number }>(
    client,
    modelHistoryQuery(model),
  );

  // Group states by stream_cid
  const streamStates: Record<string, HistoricalState[]> = {};

  for (const row of raw) {
    const streamId = new StreamID("MID", row.stream_cid).toString();

    if (!streamStates[streamId]) {
      streamStates[streamId] = [];
    }

    streamStates[streamId].push({
      streamId,
      controller: row.controller,
      state: JSON.parse(row.state),
      event_height: row.event_height,
    });
  }

  // Sort each stream's states by event_height in ascending order
  for (const streamId in streamStates) {
    streamStates[streamId].sort((a, b) => a.event_height - b.event_height);
  }

  return streamStates;
};
