import { StreamID } from "@ceramic-sdk/identifiers";
import type { ModelInstanceClient } from "@ceramic-sdk/model-instance-client";
import type { NodeIDs, PartialWithID, ResearchObject } from "../types.js";
import { MODEL_IDS } from "@desci-labs/desci-codex-models";
import type { DID } from "dids";

export const createResearchObject = async (
  client: ModelInstanceClient,
  controller: DID,
  content: ResearchObject,
): Promise<NodeIDs> => {
  const commit = await client.createInstance({
    controller,
    content,
    model: new StreamID("MID", MODEL_IDS.researchObject),
  });

  return {
    streamID: commit.baseID.toString(),
    commitID: commit.toString(),
  };
};

export const updateResearchObject = async (
  client: ModelInstanceClient,
  controller: DID,
  content: PartialWithID<ResearchObject>,
): Promise<NodeIDs> => {
  const state = await client.updateDocument({
    streamID: content.id,
    controller,
    newContent: content,
  });

  return {
    streamID: state.commitID.baseID.toString(),
    commitID: state.commitID.toString(),
  };
};
