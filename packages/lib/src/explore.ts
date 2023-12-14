import { ComposeClient } from "@composedb/client";
import { queryResearchObjects } from "./queries.js";

// TODO need to implement paging etc, mby return an observable/generator
// with the tail?

export const listResearchObjects = async (client: ComposeClient) =>
  await queryResearchObjects(client);

export const listProfiles = async (client: ComposeClient) =>
  await queryResearchObjects(client);
