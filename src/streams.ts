import { CommitType, LogEntry, Stream } from "@ceramicnetwork/common";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { CommitID, StreamID } from "@ceramicnetwork/streamid";

/**
 * Resolve the latest state of a given node ID.
 *
 * @param client - Ceramic client instance.
 * @param id - The node ID to resolve.
 * @returns A reference to the underlying stream.
 */
export const loadID = async (
  client: CeramicClient,
  id: StreamID,
): Promise<Stream> => await client.loadStream(id);

/**
 * Resolve a particular state of a given node ID.
 *
 * @param client - Ceramic client instance.
 * @param commit - The node version to resolve.
 * @returns A reference to the underlying stream, as of the given version.
 */
export const loadVersion = async (
  client: CeramicClient,
  commit: CommitID,
): Promise<Stream> => await client.loadStream(commit);

/**
 * Resolve the state as of a particular version index (0, 1, ...).
 *
 * This index does not include the anchor commits, and is zero indexed.
 * Consider this stream, with commits `c` and anchors `a`: `c0-c1-a0-c2`.
 * It has three version indices:
 * - `0` -\> `c0`
 * - `1` -\> `c1`
 * - `2` -\> `c2`
 *
 * @param client - Ceramic client instance.
 * @param id - The node ID to resolve.
 * @param index - The version index to resolve.
 * @returns A reference to the underlying stream, as of the given index.
 */
export const loadVersionIndex = async (
  client: CeramicClient,
  id: StreamID,
  index: number,
): Promise<Stream> => {
  const stream = await client.loadStream(id);
  const log = getVersionLog(stream);
  if (index < 0 || index >= length) {
    throw new RangeError(
      `Index not within the known ${log.length} stream states`,
    );
  }
  return await client.loadStream(log[index].commit);
};

/**
 * Resolve the state of a node as of a particular time.
 *
 * This is not exact, and will return the state as of the last commit that was
 * anchored before the specified time. It is guaranteed to be created somewhere
 * between that and the previous anchor.
 *
 * Consider this stream, with commits `c`, and anchors `a`: `c0-a0-c1-c2-a1`.
 * - State at time `t < a0` is empty
 * - State at time `a0 <= t < a1` is `c0`
 * - State at time `t >= a1` is `c2`
 *
 * A curious property is that `c1` is not findable through time, so investigating
 * history between updates needs to be done through the commit log.
 *
 * @param client - Ceramic client instance.
 * @param id - The node ID to resolve.
 * @param epoch - UNIX epoch to query state at.
 * @returns A reference to the underlying stream, as of the given time.
 */
export const loadAtTime = async (
  client: CeramicClient,
  id: StreamID,
  epoch: number,
): Promise<Stream> => await client.loadStream(id, { atTime: epoch });

/**
* Get the version history for a stream, by default excluding anchor commits.
*
* @param stream - The stream to get log from.
8 @returns The log of commits.
*/
export const getVersionLog = (
  stream: Stream,
  includeAnchors: boolean = false,
): Array<LogEntry & { commit: CommitID }> =>
  stream.state.log
    .filter((c) => includeAnchors || c.type !== CommitType.ANCHOR)
    .map((c) => ({ ...c, commit: CommitID.make(stream.id, c.cid) }));

export const getState = (stream: Stream): unknown => stream.state.content;
