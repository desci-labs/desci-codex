import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";
import { identify, identifyPush } from "@libp2p/identify";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { webSockets } from "@libp2p/websockets";
import { mdns } from "@libp2p/mdns";
import { kadDHT } from "@libp2p/kad-dht";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import logger from "./logger.js";
import type { FsDatastore } from "datastore-fs";
import { keychain } from "@libp2p/keychain";
import { dcutr } from "@libp2p/dcutr";
import { ping } from "@libp2p/ping";
import { mplex } from "@libp2p/mplex";
import { tls } from "@libp2p/tls";
import { autoNAT } from "@libp2p/autonat";
import { autoTLS } from "@ipshipyard/libp2p-auto-tls";
import { uPnPNAT } from "@libp2p/upnp-nat";
import { loadOrCreateSelfKey } from "@libp2p/config";

const log = logger.child({ module: "libp2p" });

// IPFS bootstrap nodes
export const BOOTSTRAP_NODES = [
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
  "/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8",
  "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
];

/**
 * Creates and configures a libp2p instance for use with Helia
 */
export async function initLibp2p(
  datastore: FsDatastore,
  privateKey: Awaited<ReturnType<typeof loadOrCreateSelfKey>>,
): Promise<Libp2p> {
  const libp2p = await createLibp2p({
    datastore,
    privateKey,
    addresses: {
      listen: [
        "/ip4/0.0.0.0/tcp/0",
        "/ip4/0.0.0.0/tcp/0/ws",
        "/ip4/0.0.0.0/udp/0/webrtc-direct",
        "/ip6/::/tcp/0",
        "/ip6/::/tcp/0/ws",
        "/ip6/::/udp/0/webrtc-direct",
        "/p2p-circuit",
      ],
    },
    transports: [
      circuitRelayTransport(),
      tcp(),
      webRTC(),
      webRTCDirect(),
      webSockets(),
    ],
    connectionEncrypters: [noise(), tls()],
    streamMuxers: [yamux(), mplex()],
    peerDiscovery: [mdns(), bootstrap({ list: BOOTSTRAP_NODES })],
    services: {
      autoNAT: autoNAT(),
      autoTLS: autoTLS(),
      dcutr: dcutr(),
      // delegatedRouting: () => createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev', delegatedHTTPRoutingDefaults()),
      dht: kadDHT({
        clientMode: true,
        protocol: "/ipfs/kad/1.0.0",
        // This approximates kubo's acceleratedDhtClient mode
        kBucketSize: Infinity,
        kBucketSplitThreshold: 20,
      }),
      identify: identify(),
      identifyPush: identifyPush(),
      keychain: keychain(),
      ping: ping(),
      upnp: uPnPNAT(),
    },
    connectionManager: {
      maxConnections: 500,
    },
  });

  // Set up event listeners
  setupEventListeners(libp2p);

  // Set up connection monitoring
  setupConnectionMonitoring(libp2p);

  log.info(
    {
      listenAddrs: libp2p.getMultiaddrs().map((addr) => addr?.toString()),
      peerId: libp2p.peerId?.toString(),
    },
    "Node addresses",
  );

  return libp2p;
}

/**
 * Sets up event listeners for the libp2p node
 */
function setupEventListeners(libp2p: Libp2p): void {
  // Add connection event listeners for debugging
  libp2p.addEventListener("peer:discovery", (evt) => {
    log.debug(
      {
        peerId: evt.detail.id?.toString(),
        multiaddrs: evt.detail.multiaddrs?.map(
          (addr: { toString: () => string }) => addr?.toString(),
        ),
      },
      "Peer discovered",
    );
  });

  libp2p.addEventListener("connection:open", (evt) => {
    log.debug(
      {
        peerId: evt.detail.remotePeer?.toString(),
        direction: evt.detail.direction,
        multiplexer: evt.detail.multiplexer,
        encryption: evt.detail.encryption,
        remoteAddr: evt.detail.remoteAddr?.toString(),
      },
      "Connected to peer",
    );
  });

  libp2p.addEventListener("connection:close", (evt) => {
    log.debug(
      {
        peerId: evt.detail.remotePeer.toString(),
        direction: evt.detail.direction,
        remoteAddr: evt.detail.remoteAddr?.toString(),
      },
      "Connection closed",
    );
  });
}

/**
 * Sets up periodic connection monitoring for the libp2p node
 */
function setupConnectionMonitoring(libp2p: Libp2p): void {
  setInterval(() => {
    const connections = libp2p.getConnections();
    const stats = {
      totalConnections: connections.length,
      inboundConnections: connections.filter((c) => c.direction === "inbound")
        .length,
      outboundConnections: connections.filter((c) => c.direction === "outbound")
        .length,
      protocols: libp2p.getProtocols(),
      listenAddrs: libp2p.getMultiaddrs().map((addr) => addr?.toString()),
      // Add connection quality metrics
      connectionStates: connections.map((c) => ({
        peerId: c.remotePeer?.toString(),
        direction: c.direction,
        multiplexer: c.multiplexer,
        encryption: c.encryption,
        remoteAddr: c.remoteAddr?.toString(),
      })),
    };
    log.debug(stats, "Connection stats");
  }, 30000); // Log every 30 seconds
}
