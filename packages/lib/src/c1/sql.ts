import type { StreamID } from "@ceramic-sdk/identifiers";
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
