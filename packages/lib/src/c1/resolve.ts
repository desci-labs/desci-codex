import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { CommitID, StreamID } from "@ceramic-sdk/identifiers";
import type { HistoricalState, RawResearchObject } from "./explore.js";
import { instantQuery } from "./queries.js";
import {
  commitStateQuery,
  streamHistoryQuery,
  streamStateAtHeightQuery,
} from "./sql.js";

/**
 * Get the history of a stream.
 * @param client - The FlightSQL client.
 * @param streamId - The ID of the stream to get the history of.
 * @returns The history of the stream.
 */
export const getStreamHistory = async (
  client: FlightSqlClient,
  streamId: string,
): Promise<HistoricalState[]> => {
  const stream = StreamID.fromString(streamId);
  const raw = await instantQuery<RawResearchObject & { event_height: number }>(
    client,
    streamHistoryQuery(stream),
  );
  return raw.map((row) => ({
    streamId: new StreamID("MID", row.stream_cid).toString(),
    controller: row.controller,
    state: JSON.parse(row.state),
    event_height: row.event_height,
  }));
};

/**
 * Get the state of a specific commit.
 * @param client - The FlightSQL client.
 * @param commitId - The commitID to get the state for.
 * @returns The state of the specified commit.
 * @throws Error if the commit state cannot be found.
 */
export const getCommitState = async (
  client: FlightSqlClient,
  commitId: string,
): Promise<HistoricalState> => {
  const commit = CommitID.fromString(commitId);
  const raw = await instantQuery<
    RawResearchObject & { event_height: number; event_cid: string }
  >(client, commitStateQuery(commit));

  if (raw.length === 0) {
    throw new Error(`No state found for commit ${commitId}`);
  }

  if (raw.length > 1) {
    console.warn(
      {
        streamId: commit.baseID.toString(),
        commitId,
        data: JSON.stringify(raw),
      },
      "Multiple results found for given commit. Expected only one result.",
    );
  }

  const row = raw[0];
  return {
    streamId: new StreamID("MID", row.stream_cid).toString(),
    controller: row.controller,
    state: JSON.parse(row.state),
    event_height: row.event_height,
  };
};

/**
 * Get the state of a stream at a specific event height.
 * @param client - The FlightSQL client.
 * @param streamId - The ID of the stream.
 * @param eventHeight - The event height to get the state for.
 * @returns The state of the stream at the specified event height.
 * @throws Error if the state at the specified event height cannot be found.
 */
export const getStreamStateAtHeight = async (
  client: FlightSqlClient,
  streamId: string,
  eventHeight: number,
): Promise<HistoricalState> => {
  const stream = StreamID.fromString(streamId);
  const raw = await instantQuery<
    RawResearchObject & { event_height: number; event_cid: string }
  >(client, streamStateAtHeightQuery(stream, eventHeight));

  if (raw.length === 0) {
    throw new Error(
      `No state found for stream ${streamId} at event height ${eventHeight}`,
    );
  }

  if (raw.length > 1) {
    console.warn(
      {
        streamId,
        eventHeight,
        data: JSON.stringify(raw),
      },
      "Multiple results found for given event height. Expected only one result.",
    );
  }

  const row = raw[0];
  return {
    streamId: new StreamID("MID", row.stream_cid).toString(),
    controller: row.controller,
    state: JSON.parse(row.state),
    event_height: row.event_height,
  };
};
