import type { CommitID, StreamID } from "@ceramic-sdk/identifiers";
import { MODEL_IDS } from "@desci-labs/desci-codex-models";

/**
 * Get the latest state of all streams implementing a given model.
 * @param modelId - The ID of the model to get the latest state of streams for.
 * @returns The latest state of all streams implementing the model.
 */
export const allResearchObjectsQuery = (modelId?: StreamID) => `
  SELECT DISTINCT ON (stream_cid)
    controller,
    cid_string(stream_cid) as stream_cid,
    data::varchar->>'content' as state
  FROM event_states
  WHERE stream_id_string(arrow_cast(dimension_extract(dimensions, 'model'),'Binary')) = '${modelId?.toString() ?? MODEL_IDS.researchObject}'
  ORDER BY stream_cid, event_height DESC;
`;

/**
 * Get all historical states of a givenstream.
 * @param streamId - The ID of the stream to get the history of.
 * @returns The history of the stream.
 */
export const streamHistoryQuery = (streamId: StreamID) => `
  SELECT
    controller,
    cid_string(stream_cid) as stream_cid,
    data::varchar->>'content' as state,
    event_height
  FROM event_states
  WHERE cid_string(stream_cid) = '${streamId.cid.toString()}'
  ORDER BY event_height ASC;
`;

/**
 * Get all historical states of all streams implementing a given model.
 *
 * @param modelId - The ID of the model to get stream histories for.
 * @returns The history of all streams implementing the model.
 */
export const modelHistoryQuery = (modelId: StreamID) => `
  SELECT
    controller,
    cid_string(stream_cid) as stream_cid,
    data::varchar->>'content' as state,
    event_height
  FROM event_states
  WHERE stream_id_string(arrow_cast(dimension_extract(dimensions, 'model'),'Binary')) = '${modelId.toString()}'
  ORDER BY stream_cid, event_height ASC;
`;

/**
 * Get the state as of a specific commit.
 * @param commitId - The commitID to get the state for.
 * @returns The state of the specified commit.
 */
export const commitStateQuery = (commitId: CommitID) => `
  SELECT
    controller,
    cid_string(stream_cid) as stream_cid,
    cid_string(event_cid) as event_cid,
    data::varchar->>'content' as state,
    event_height
  FROM event_states
  WHERE cid_string(event_cid) = '${commitId.commit.toString()}';
`;

/**
 * Get the state of a stream at a specific event height.
 * @param streamId - The ID of the stream.
 * @param eventHeight - The event height to get the state for.
 * @returns The state of the stream at the specified event height.
 */
export const streamStateAtHeightQuery = (
  streamId: StreamID,
  eventHeight: number,
) => `
  SELECT
    controller,
    cid_string(stream_cid) as stream_cid,
    cid_string(event_cid) as event_cid,
    data::varchar->>'content' as state,
    event_height
  FROM event_states
  WHERE cid_string(stream_cid) = '${streamId.cid.toString()}'
    AND event_height = ${eventHeight};
`;
