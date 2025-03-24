import { createLibp2p, type Libp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";
import { identify } from "@libp2p/identify";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { webSockets } from "@libp2p/websockets";
import { mdns } from "@libp2p/mdns";
import { kadDHT } from "@libp2p/kad-dht";
import logger from "./logger.js";

const log = logger.child({ module: "libp2p" });

// IPFS bootstrap nodes
export const BOOTSTRAP_NODES = [
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
  "/dnsaddr/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpMkewWLVYC098bEsr2eQJY3z3aXSKi4m3LhpXgG",
  "/dnsaddr/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6",
  "/dnsaddr/node2.preload.ipfs.io/tcp/443/wss/p2p/QmV7gnbW5VTcJ3oyM2Xk1rdFBJ3kTkvxc87UFGsun29STS",
  "/dnsaddr/node3.preload.ipfs.io/tcp/443/wss/p2p/QmY7JB6MQXhxHvq7dBDh4HpbH29v2y2PJ1YYWihMpQhkW6",
];

/**
 * Creates and configures a libp2p instance for use with Helia
 */
export async function initLibp2p(): Promise<Libp2p> {
  // Create libp2p node
  const libp2p = await createLibp2p({
    addresses: {
      listen: [
        "/ip4/0.0.0.0/tcp/0", // Keep dynamic port for flexibility
        "/ip4/0.0.0.0/tcp/4001", // Add standard IPFS port
      ],
    },
    transports: [
      tcp(),
      circuitRelayTransport(),
      webSockets(), // Add WebSocket support for better connectivity
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: BOOTSTRAP_NODES,
      }),
      mdns(), // Enable local network discovery
    ],
    services: {
      identify: identify({
        protocolPrefix: "ipfs",
      }),
      dht: kadDHT({
        clientMode: true, // Run as a DHT client instead of full node
        protocol: "/ipfs/kad/1.0.0",
      }),
    },
    connectionManager: {
      maxConnections: 100, // Increase connection limit
    },
  });

  // Set up event listeners
  setupEventListeners(libp2p);

  // Set up connection monitoring
  setupConnectionMonitoring(libp2p);

  // Log bootstrap process
  log.info({ bootstrapNodes: BOOTSTRAP_NODES }, "Starting bootstrap process");
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
        localAddr: evt.detail.localAddr?.toString(),
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
        localAddr: evt.detail.localAddr?.toString(),
      },
      "Connection closed",
    );
  });

  // Add more event listeners for better connection monitoring
  libp2p.addEventListener("peer:connect", (evt) => {
    log.debug(
      {
        peerId: evt.detail.remotePeer?.toString(),
        direction: evt.detail.direction,
        remoteAddr: evt.detail.remoteAddr?.toString(),
      },
      "Peer connected",
    );
  });

  libp2p.addEventListener("peer:disconnect", (evt) => {
    log.debug(
      {
        peerId: evt.detail.remotePeer?.toString(),
        direction: evt.detail.direction,
        remoteAddr: evt.detail.remoteAddr?.toString(),
      },
      "Peer disconnected",
    );
  });

  libp2p.addEventListener("connection:prune", (evt) => {
    log.debug(
      {
        peerId: evt.detail.remotePeer?.toString(),
        direction: evt.detail.direction,
        remoteAddr: evt.detail.remoteAddr?.toString(),
      },
      "Connection pruned",
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
