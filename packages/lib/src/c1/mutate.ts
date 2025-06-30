import { StreamID } from "@ceramic-sdk/identifiers";
import type { ModelInstanceClient } from "@ceramic-sdk/model-instance-client";
import type { NodeIDs, PartialWithID, ResearchObject } from "../types.js";
import { MODEL_IDS } from "@desci-labs/desci-codex-models";
import type { DID } from "dids";

/**
 * Create a new research object.
 *
 * @param client - The ModelInstanceClient to use.
 * @param controller - The DID of the controller.
 * @param content - The content of the research object.
 */
export const createResearchObject = async (
  client: ModelInstanceClient,
  controller: DID,
  content: ResearchObject,
  /** Optionally specify a custom model to use for the research object. */
  model?: StreamID,
): Promise<NodeIDs> => {
  const commit = await client.createInstance({
    controller,
    content,
    model: model ?? StreamID.fromString(MODEL_IDS.researchObject),
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
    newContent: {
      ...content,
      id: undefined, // Remove the id from the content as it's not part of the model
    },
  });

  return {
    streamID: state.commitID.baseID.toString(),
    commitID: state.commitID.toString(),
  };
};
