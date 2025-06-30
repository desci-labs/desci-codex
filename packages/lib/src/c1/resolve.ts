import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { CommitID, StreamID } from "@ceramic-sdk/identifiers";
import type { HistoricalState, RawResearchObject } from "./explore.js";
import { instantQuery } from "./queries.js";
import { streamHistoryQuery, streamHistoryQueryMultiple } from "./sql.js";
import type { ResearchObject, ResearchObjectHistory } from "../types.js";
import { cleanupEip155Address } from "../util.js";
import { propagateAnchorTimeToRows } from "./util.js";

/**
 * Convert raw aggregator rows for a single stream to a joint research object history.
 *
 * @param rawRows - The raw rows to convert.
 * @returns The research object history.
 */
export const rawRowsToResearchObjectHistory = (
  rawRows: RawResearchObject[],
): ResearchObjectHistory => {
  const withTime = propagateAnchorTimeToRows(rawRows);

  return {
    id: new StreamID("MID", withTime[0].stream_cid).toString(),
    owner: cleanupEip155Address(withTime[0].controller),
    manifest: JSON.parse(withTime[0].state).manifest,
    versions: withTime.map((row) => {
      const state = JSON.parse(row.state) as ResearchObject;
      return {
        version: new CommitID("MID", row.stream_cid, row.event_cid).toString(),
        time: row.before ?? undefined, // null for unanchored events
        manifest: state.manifest,
        title: state.title,
        license: state.license,
      };
    }),
  };
};

/**
 * Get the history of a stream.
 *
 * @param client - The FlightSQL client.
 * @param streamId - The ID of the stream to get the history of.
 * @returns The history of the stream.
 */
export const getStreamHistory = async (
  client: FlightSqlClient,
  streamId: string,
): Promise<ResearchObjectHistory> => {
  const stream = StreamID.fromString(streamId);
  const raw = await instantQuery<RawResearchObject>(
    client,
    streamHistoryQuery(stream),
  );

  if (raw.length === 0) {
    throw new Error(`No history found for stream ${streamId}`);
  }

  return rawRowsToResearchObjectHistory(raw);
};

/**
 * Get the history of multiple streams.
 *
 * @param client - The FlightSQL client.
 * @param streamIds - The IDs of the streams to get the history of.
 * @returns The history of the streams.
 */
export const getStreamHistoryMultiple = async (
  client: FlightSqlClient,
  streamIds: string[],
): Promise<ResearchObjectHistory[]> => {
  const streams = streamIds.map((id) => StreamID.fromString(id));
  const raw = await instantQuery<RawResearchObject>(
    client,
    streamHistoryQueryMultiple(streams),
  );

  if (raw.length === 0) {
    throw new Error(`No history found for streams ${streamIds.join(", ")}`);
  }

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

/**
 * Get the state of a specific commit.
 *
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
  const stream = commit.baseID;
  const raw = await instantQuery<RawResearchObject>(
    client,
    streamHistoryQuery(stream),
  );

  if (raw.length === 0) {
    throw new Error(`No state found for stream ${commit.baseID.toString()}`);
  }

  const history = rawRowsToResearchObjectHistory(raw);

  const version = history.versions.find((row) => row.version === commitId);

  if (!version) {
    throw new Error(`No state found for commit ${commitId}`);
  }

  return {
    id: stream.toString(),
    version: commitId,
    owner: history.owner,
    state: version,
    time: version.time, // null for unanchored events
  };
};

/**
 * Get the state of a stream at a specific event height.
 *
 * @param client - The FlightSQL client.
 * @param streamId - The ID of the stream.
 * @param eventHeight - Version index to get state for.
 * @returns The state of the stream at the specified event height.
 * @throws Error if the state at the specified event height cannot be found.
 */
export const getStreamStateAtVersion = async (
  client: FlightSqlClient,
  streamId: string,
  version: number,
): Promise<HistoricalState> => {
  const stream = StreamID.fromString(streamId);
  const raw = await instantQuery<RawResearchObject>(
    client,
    streamHistoryQuery(stream),
  );

  if (raw.length === 0) {
    throw new Error(`No state found for stream ${streamId}`);
  }

  const history = rawRowsToResearchObjectHistory(raw);

  if (version > history.versions.length - 1) {
    console.error("Version not found for stream", {
      streamId,
      version,
      data: JSON.stringify(raw),
    });
    throw new Error(
      `No state found for stream ${streamId} at version ${version}`,
    );
  }

  const requestedVersion = history.versions[version];
  return {
    id: streamId,
    version: requestedVersion.version,
    owner: history.owner,
    state: requestedVersion,
    time: requestedVersion.time,
  };
};
