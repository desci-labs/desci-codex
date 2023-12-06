import { CommitID, StreamID } from "@ceramicnetwork/streamid";
import { getState, loadID, loadVersion, loadVersionIndex } from "./streams.js";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { assertUnreachable } from "./util.js";

/**
 * The latest state of a node.
 */
export type RootNode = {
  tag: "root";
  id: StreamID;
};

/**
 * An exact version of a node.
 */
export type VersionedNode = {
  tag: "versioned";
  id: CommitID;
};

/**
 * Version index of a node.
 */
export type IndexedNode = {
  tag: "indexed";
  id: StreamID;
  versionIx: number;
};

/**
 * Persistent address the state of a node.
 */
export type PID = RootNode | VersionedNode | IndexedNode;

/**
 * Resolve the state of a node at a particular version, or the latest known.
 * This does not substitute IPLD links with their content.
 *
 * @param client - A Ceramic client instance.
 * @param pid - The address of a node.
 * @returns the raw state of the addressed document.
 */
export const resolveNode = async (
  client: CeramicClient,
  pid: PID,
): Promise<unknown> => {
  let stream;
  switch (pid.tag) {
    case "root":
      stream = await loadID(client, pid.id);
      break;
    case "versioned":
      stream = await loadVersion(client, pid.id);
      break;
    case "indexed":
      stream = await loadVersionIndex(client, pid.id, pid.versionIx);
      break;
    default:
      return assertUnreachable(pid);
  }
  return getState(stream);
};
