import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { instantQuery } from "./queries.js";
import { CommitID, StreamID } from "@ceramic-sdk/identifiers";
import type {
  ResearchObject,
  ResearchObjectHistory,
  WithMeta,
} from "../types.js";
import { allResearchObjectsQuery, modelHistoryQuery } from "./sql.js";
import { cleanupEip155Address } from "../util.js";
import { rawRowsToResearchObjectHistory } from "./resolve.js";

export type RawResearchObject = {
  stream_cid: string;
  event_cid: string;
  controller: string;
  state: string;
  before: number | null;
  event_type: 0 | 1;
};

export type HistoricalState = {
  id: string;
  version: string;
  owner: string;
  state: ResearchObject;
  time: number | undefined;
};

/**
 * List the latest state of all research objects.
 *
 * @param client - The FlightSqlClient to use.
 * @param model - Optionally filter on custom model ID.
 * @returns A list of research objects.
 */
export const listResearchObjects = async (
  client: FlightSqlClient,
  model?: StreamID,
): Promise<WithMeta<ResearchObject>[]> => {
  const raw = await instantQuery<RawResearchObject>(
    client,
    allResearchObjectsQuery(model),
  );

  return raw.map((row) => {
    const state = row.state ? JSON.parse(row.state) : undefined;
    if (!state) {
      console.warn("Stream state is null!", {
        stream_cid: row.stream_cid,
        state: JSON.stringify(row.state),
        parsed: state,
      });
    }
    return {
      id: new StreamID("MID", row.stream_cid).toString(),
      version: new CommitID("MID", row.stream_cid, row.event_cid).toString(),
      owner: cleanupEip155Address(row.controller),
      manifest: state?.manifest,
      title: state?.title,
      license: state?.license,
    };
  });
};

/**
 * List all research objects with their full history.
 *
 * @param client - The FlightSqlClient to use.
 * @param model - Optionally filter on custom model ID.
 * @returns A map of streamIDs to their chronological historical states.
 */
export const listResearchObjectsWithHistory = async (
  client: FlightSqlClient,
  model?: StreamID,
): Promise<ResearchObjectHistory[]> => {
  const raw = await instantQuery<RawResearchObject>(
    client,
    modelHistoryQuery(model),
  );

  const groupedRows: Record<string, RawResearchObject[]> = {};
  for (const row of raw) {
    const streamId = new StreamID("MID", row.stream_cid).toString();

    if (!groupedRows[streamId]) {
      groupedRows[streamId] = [row];
    } else {
      groupedRows[streamId].push(row);
    }
  }

  return Object.values(groupedRows).map(rawRowsToResearchObjectHistory);
};
