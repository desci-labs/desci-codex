import { useEffect, useState } from "react";
import { useGeocoding, getLocationKey } from "@/hooks/useGeocoding";
import { useUIStore } from "@/store/uiStore";
import type { LeafletMouseEvent } from "leaflet";

interface NodesMapProps {
  nodes: Array<{
    nodeId: string;
    ceramicPeerId: string;
    location?: {
      country?: string | null;
      city?: string | null;
    } | null;
    lastSeenAt: string;
  }>;
}

export function NodesMap({ nodes }: NodesMapProps) {
  const { isDarkMode } = useUIStore();
  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leafletComponents, setLeafletComponents] = useState<any>(null);

  // Extract unique locations from nodes (always call this)
  const locations = nodes
    .filter((node) => node.location?.country)
    .map((node) => node.location!);

  // Geocode locations to get coordinates (always call hooks)
  const { geocodedLocations, isLoading } = useGeocoding(locations);

  // Only load on client side
  useEffect(() => {
    setIsClient(true);

    // Dynamic import of Leaflet components
    const loadLeaflet = async () => {
      const [{ MapContainer, TileLayer, CircleMarker, Tooltip }] =
        await Promise.all([
          import("react-leaflet"),
          import("leaflet/dist/leaflet.css"),
        ]);

      setLeafletComponents({
        MapContainer,
        TileLayer,
        CircleMarker,
        Tooltip,
      });
    };

    loadLeaflet();
  }, []);

  if (!isClient || !leafletComponents) {
    return (
      <div
        className={`relative h-[500px] w-full rounded-lg overflow-hidden border ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-gray-200 bg-gray-50"} flex items-center justify-center`}
      >
        <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
          Loading map...
        </p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = leafletComponents;

  // Group nodes by location
  const nodesByLocation = nodes.reduce(
    (acc, node) => {
      if (!node.location?.country) return acc;

      const key = getLocationKey(node.location);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(node);
      return acc;
    },
    {} as Record<string, typeof nodes>,
  );

  // Calculate active status (within last hour)
  const isNodeActive = (lastSeenAt: string) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return new Date(lastSeenAt).getTime() > oneHourAgo;
  };

  if (geocodedLocations.size === 0 && !isLoading) {
    return (
      <div
        className={`rounded-lg border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-gray-50 border-gray-200"} backdrop-blur p-8 text-center`}
      >
        <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
          No geographic data available for nodes yet.
        </p>
        <p
          className={`mt-2 text-sm ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
        >
          Node locations will appear as they connect to the network.
        </p>
      </div>
    );
  }

  if (isLoading && geocodedLocations.size === 0) {
    return (
      <div
        className={`rounded-lg border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-gray-50 border-gray-200"} backdrop-blur p-8 text-center`}
      >
        <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
          Loading node locations...
        </p>
      </div>
    );
  }

  // Choose map tile based on theme
  const tileUrl = isDarkMode
    ? "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png"
    : "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png";

  return (
    <div
      className={`relative h-[500px] w-full rounded-lg overflow-hidden border ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-gray-200 bg-gray-50"}`}
    >
      {/* Legend */}
      <div
        className={`absolute top-4 right-4 z-[1000] ${isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-gray-200"} backdrop-blur-sm rounded-lg p-3 border`}
      >
        <h3
          className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-gray-600"} mb-2`}
        >
          Node Status
        </h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/60 border border-green-500"></div>
            <span
              className={`text-xs ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
            >
              Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isDarkMode ? "bg-slate-500/60 border-slate-500" : "bg-gray-400/60 border-gray-400"}`}
            ></div>
            <span
              className={`text-xs ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
            >
              Inactive
            </span>
          </div>
        </div>
      </div>

      {/* Global Node Count */}
      <div
        className={`absolute top-4 left-4 z-[1000] ${isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-gray-200"} backdrop-blur-sm rounded-lg p-3 border`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <p
              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Global Network
            </p>
            <p
              className={`text-lg font-semibold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}
            >
              {nodes.length} Nodes
            </p>
          </div>
        </div>
      </div>

      {/* OpenStreetMap Attribution */}
      <div
        className={`absolute bottom-4 right-4 z-[1000] ${isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-gray-200"} backdrop-blur-sm rounded px-2 py-1 border`}
      >
        <p
          className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
        >
          Map data from{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className={`${isDarkMode ? "text-slate-300 hover:text-slate-100" : "text-gray-700 hover:text-gray-900"} underline`}
          >
            OpenStreetMap
          </a>
        </p>
      </div>

      <MapContainer
        key={`map-${geocodedLocations.size}`} // Force remount when locations change
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={4}
        className="h-full w-full"
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={true}
      >
        <TileLayer url={tileUrl} />

        {Array.from(geocodedLocations.entries()).map(
          ([locationKey, coords]) => {
            const nodesAtLocation = nodesByLocation[locationKey] || [];
            if (nodesAtLocation.length === 0) return null;

            const hasActiveNode = nodesAtLocation.some((n) =>
              isNodeActive(n.lastSeenAt),
            );
            const nodeCount = nodesAtLocation.length;

            // Dynamic sizing based on number of nodes
            const radius = Math.min(8 + nodeCount * 2, 20);

            // Color based on activity status and theme
            const color = hasActiveNode
              ? "#10b981"
              : isDarkMode
                ? "#64748b"
                : "#9ca3af";
            const fillColor = hasActiveNode
              ? "#10b981"
              : isDarkMode
                ? "#64748b"
                : "#9ca3af";

            // Extract location info for display
            const firstNode = nodesAtLocation[0];
            const locationName = firstNode.location?.city
              ? `${firstNode.location.city}, ${firstNode.location.country}`
              : firstNode.location?.country || "Unknown";

            return (
              <CircleMarker
                key={locationKey}
                center={[coords.lat, coords.lng]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: fillColor,
                  fillOpacity: 0.6,
                  weight: 2,
                  opacity: 0.8,
                }}
                eventHandlers={{
                  mouseover: (e: LeafletMouseEvent) => {
                    e.target.setStyle({
                      fillOpacity: 0.9,
                      weight: 3,
                    });
                  },
                  mouseout: (e: LeafletMouseEvent) => {
                    e.target.setStyle({
                      fillOpacity: 0.6,
                      weight: 2,
                    });
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  opacity={0.95}
                  className={
                    isDarkMode
                      ? "!bg-slate-900 !border-slate-700 !text-slate-100"
                      : "!bg-white !border-gray-300 !text-gray-900"
                  }
                >
                  <div className="p-1">
                    <p className="font-medium text-sm">{locationName}</p>
                    <p
                      className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                    >
                      {nodeCount} node{nodeCount > 1 ? "s" : ""}
                    </p>
                    {hasActiveNode && (
                      <p className="text-xs text-green-500 mt-1">Active</p>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          },
        )}
      </MapContainer>
    </div>
  );
}
