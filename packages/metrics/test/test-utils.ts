import { generateKeyPair } from "@libp2p/crypto/keys";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import type { Ed25519PrivateKey, PeerId } from "@libp2p/interface";

/**
 * Generates a random valid libp2p peer ID for testing.
 * This creates a real Ed25519 key pair and derives a peer ID from it.
 * The peer ID contains an embedded public key and can be used for signature validation.
 *
 * @returns Promise containing the peer ID and private key
 */
export async function generateTestPeerId(): Promise<{
  peerId: PeerId;
  privateKey: Ed25519PrivateKey;
}> {
  const privateKey = await generateKeyPair("Ed25519");
  const peerId = peerIdFromPrivateKey(privateKey);
  return { peerId, privateKey };
}

/**
 * Generates a new valid libp2p peer ID string for testing.
 * This creates a fresh Ed25519 key pair and returns just the peer ID string.
 * Each call generates a unique peer ID.
 *
 * @returns Promise containing a new peer ID string
 */
export async function newPeerIdString(): Promise<string> {
  const privateKey = await generateKeyPair("Ed25519");
  const peerId = peerIdFromPrivateKey(privateKey);
  return peerId.toString();
}

/**
 * Generates an incorrect node ID string that is NOT a valid peer ID.
 * Only use this for testing error cases where peer ID validation should fail.
 *
 * @param suffix - Optional suffix to append to the incorrect ID
 * @returns An incorrect node ID string that is not a valid peer ID
 */
export function generateIncorrectNodeId(suffix: string = "test"): string {
  return `node-${suffix}`;
}
