import type { FlightSqlClient } from "@ceramic-sdk/flight-sql-client";
import { instantQuery } from "./queries.js";
import { StreamID } from "@ceramic-sdk/identifiers";
import type { ResearchObject } from "../types.js";
import { allResearchObjectsQuery } from "./sql.js";

type RawResearchObject = {
  stream_cid: string;
  controller: string;
  state: string;
};

type C1ResearchObject = {
  owner: string;
  streamId: string;
  state: ResearchObject;
};

export const listResearchObjects = async (
  client: FlightSqlClient,
  model?: StreamID,
): Promise<C1ResearchObject[]> => {
  const raw = await instantQuery<RawResearchObject>(
    client,
    allResearchObjectsQuery(model?.toString()),
  );
  return raw.map((row) => ({
    owner: row.controller,
    streamId: new StreamID("MID", row.stream_cid).toString(),
    state: JSON.parse(row.state),
  }));
};
