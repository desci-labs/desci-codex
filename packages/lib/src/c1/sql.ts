import { MODEL_IDS } from "@desci-labs/desci-codex-models";

export const allResearchObjectsQuery = `
  SELECT DISTINCT ON (stream_cid)
    controller,
    cid_string(stream_cid) as stream_cid,
    data::varchar->>'content' as state
  FROM event_states
  WHERE stream_id_string(arrow_cast(dimension_extract(dimensions, 'model'),'Binary')) = '${MODEL_IDS.researchObject}'
  ORDER BY stream_cid, event_height desc;
`;
