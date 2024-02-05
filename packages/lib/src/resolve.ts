/**
 * This module is tasked with resolving node states from different types of
 * identifiers.
 *
 * These functions are, to some extent, dependent on network consensus.
 * In particular, all sidetree protocols are vulnerable to late-publishing
 * attacks ({@link https://developers.ceramic.network/docs/protocol/js-ceramic/streams/consensus#late-publishing}).
 * This means that the stream owner can potentially withhold an earlier update,
 * and make it known later in such a way that network consensus re-orders the
 * stream.
 *
 * The effects of which depends on the mode of resolution. A `StreamID` will
 * continue to uniquely identify the stream, and a `CommitID` will still
 * uniquely identify the historical state which it always did. However, until
 * {@link https://github.com/ceramicnetwork/js-ceramic/issues/3057 | this PR}
 * is implemented it cannot be done through the regular API, but is possible
 * by fetching the commit CID from IPFS.
 *
 * Naturally, version indexes and anchor time bounds are more sensitive, as
 * the network understanding of stream history would change. With CIP-145,
 * nodes will know the entire previous state, and one could in theory define a
 * total order over the branches to make this stable. Meanwhile, it's worth
 * reiterating that only the stream owner can attack itself, limiting the
 * consequences.
 *
 * @packageDocumentation
 */

import { CommitID, StreamID } from "@ceramicnetwork/streamid";
import {
  type LogWithCommits,
  getState,
  getVersionLog,
  loadAtTime,
  loadID,
  loadVersion,
  loadVersionIndex,
} from "./streams.js";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { assertUnreachable } from "./util.js";

/**
 * The latest state of a node, meaning the latest known commit. Hence, it is
 * not stable over time, but
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
 * Version index of a node. As this index disregards anchor events, it is
 * stable to the limits of a late publishing attack.
 */
export type IndexedNode = {
  tag: "indexed";
  id: StreamID;
  versionIx: number;
};

/**
 * The state as of a certain anchor time.
 */
export type AnchorTimeLimitNode = {
  tag: "time";
  id: StreamID;
  epoch: number;
};

/**
 * Persistent address of a particular node state.
 */
export type PID = RootNode | VersionedNode | IndexedNode | AnchorTimeLimitNode;

/**
 * Resolve the state of a node at a particular version, or the latest known.
 * This does not substitute IPLD links with their content.
 *
 * @param client - A Ceramic client instance.
 * @param pid - The address of a node state.
 * @returns the raw state of the addressed document.
 */
export const resolveState = async (
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
    case "time":
      stream = await loadAtTime(client, pid.id, pid.epoch);
      break;
    default:
      return assertUnreachable(pid);
  }
  return getState(stream);
};

/**
 * Resolve the commit history of a stream, optionally including anchor commits.
 * Use this to inspect historical changes of a particular node. This may be
 * necessary to discern between multiple updates under the same anchor.
 *
 * @param client - A Ceramic client instance.
 * @param id - The address of a node state.
 * @param includeAnchors - Optionally include anchor commits in the log.
 * @returns an array of the historical events of the stream.
 */
export const resolveHistory = async (
  client: CeramicClient,
  id: StreamID | string,
  includeAnchors: boolean = false,
): Promise<LogWithCommits> => {
  if (typeof id === "string") {
    id = StreamID.fromString(id);
  }
  return await loadID(client, id).then((s) => getVersionLog(s, includeAnchors));
};

export const pidFromStringID = (stringID: string): RootNode | VersionedNode => {
  const commit = CommitID.fromStringNoThrow(stringID);
  if (commit instanceof CommitID) {
    return { tag: "versioned", id: commit };
  }

  const stream = StreamID.fromStringNoThrow(stringID);
  if (stream instanceof StreamID) {
    return { tag: "root", id: stream };
  }

  throw new Error("Passed string is neither a stream nor a commit ID");
};
