import type { Node } from "@/types/metrics";

export const demoNodes: Node[] = [
  {
    nodeId: "demo-gothenburg-001",
    ceramicPeerId: "12D3KooWGothenburg",
    location: {
      country: "Sweden",
      city: "Gothenburg",
    },
    lastSeenAt: new Date().toISOString(), // Active node
    firstSeenAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    nodeId: "demo-newyork-002",
    ceramicPeerId: "12D3KooWNewYork",
    location: {
      country: "United States",
      city: "New York",
    },
    lastSeenAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago (active)
    firstSeenAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    nodeId: "demo-tokyo-003",
    ceramicPeerId: "12D3KooWTokyo",
    location: {
      country: "Japan",
      city: "Tokyo",
    },
    lastSeenAt: new Date().toISOString(), // Active
    firstSeenAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    nodeId: "demo-sydney-004",
    ceramicPeerId: "12D3KooWSydney",
    location: {
      country: "Australia",
      city: "Sydney",
    },
    lastSeenAt: new Date().toISOString(), // Active
    firstSeenAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    nodeId: "demo-capetown-005",
    ceramicPeerId: "12D3KooWCapeTown",
    location: {
      country: "South Africa",
      city: "Cape Town",
    },
    lastSeenAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago (active)
    firstSeenAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    nodeId: "demo-london-006",
    ceramicPeerId: "12D3KooWLondon",
    location: {
      country: "United Kingdom",
      city: "London",
    },
    lastSeenAt: new Date().toISOString(), // Active
    firstSeenAt: new Date(Date.now() - 518400000).toISOString(),
  },
  {
    nodeId: "demo-berlin-007",
    ceramicPeerId: "12D3KooWBerlin",
    location: {
      country: "Germany",
      city: "Berlin",
    },
    lastSeenAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago (active)
    firstSeenAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    nodeId: "demo-singapore-008",
    ceramicPeerId: "12D3KooWSingapore",
    location: {
      country: "Singapore",
      city: "Singapore",
    },
    lastSeenAt: new Date().toISOString(), // Active
    firstSeenAt: new Date(Date.now() - 691200000).toISOString(),
  },
  {
    nodeId: "demo-mumbai-009",
    ceramicPeerId: "12D3KooWMumbai",
    location: {
      country: "India",
      city: "Mumbai",
    },
    lastSeenAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago (inactive)
    firstSeenAt: new Date(Date.now() - 864000000).toISOString(),
  },
];

/**
 * Get demo nodes for development environment
 * Returns empty array in production
 */
export function getDemoNodes(): Node[] {
  // Use Vite's import.meta.env for environment detection
  if (import.meta.env.DEV) {
    return demoNodes;
  }
  return [];
}
