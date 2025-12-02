/**
 * This module is responsible for converting (country,city) pairs to lat/lon
 * coordinates for use in the node distribution map component. For privacy reasons,
 * the metrics server doesn't send IP or exact location so we get it on a city granularity.
 *
 * The city coordinates are pulled from Nominatim, the OpenStreetMap API. This is free and
 * has a low rate limit, and to stay withing the ToS we cache the locations in localstorage
 * on the client side.
 */
import { useEffect, useState } from "react";

interface GeoLocation {
  lat: number;
  lng: number;
}

interface LocationCache {
  [key: string]: GeoLocation | null;
}

const CACHE_KEY = "codex_geocoding_cache";
const CACHE_VERSION = "v1";

const loadCache = (): LocationCache => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only check version, ignore timestamp for unlimited TTL as cities don't generally move around a lot
      if (parsed.version === CACHE_VERSION) {
        return parsed.data || {};
      }
    }
  } catch (error) {
    console.error("Failed to load geocoding cache:", error);
  }
  return {};
};

const saveCache = (cache: LocationCache) => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: cache,
      }),
    );
  } catch (error) {
    console.error("Failed to save geocoding cache:", error);
  }
};

// Initialize cache lazily on first use to avoid SSR issues
let locationCache: LocationCache | null = null;

const getCache = (): LocationCache => {
  if (locationCache === null) {
    locationCache = loadCache();
  }
  return locationCache;
};

/**
 * Custom hook to geocode country+city to coordinates using Nominatim (OpenStreetMap)
 */
export function useGeocoding(
  locations:
    | Array<{ country?: string | null; city?: string | null }>
    | undefined,
) {
  const [geocodedLocations, setGeocodedLocations] = useState<
    Map<string, GeoLocation>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const locationsKey = !locations
    ? ""
    : locations
        .map((loc) => `${loc.city || ""}::${loc.country || ""}`)
        .sort()
        .join("|");

  useEffect(() => {
    if (!locations || locations.length === 0) return;

    const geocodeLocations = async () => {
      setIsLoading(true);
      const newLocations = new Map<string, GeoLocation>();
      let hasNewRequests = false;
      let cacheUpdated = false;

      for (const location of locations) {
        if (!location.country) continue;

        // Create a unique key for this location
        const locationKey = `${location.city || ""}::${location.country}`;

        // Check cache first
        const cache = getCache();
        if (cache[locationKey] !== undefined) {
          if (cache[locationKey]) {
            newLocations.set(locationKey, cache[locationKey]!);
          }
          continue;
        }

        hasNewRequests = true;

        try {
          // Build query string - prefer city+country, fallback to country only
          const query = location.city
            ? `${location.city}, ${location.country}`
            : location.country;

          // Use Nominatim API (OpenStreetMap) - free, no API key required
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
              `q=${encodeURIComponent(query)}&format=json&limit=1`,
            {
              headers: {
                // ToS require a custom user-agent header
                "User-Agent": "Codex Network Status Dashboard",
              },
            },
          );

          if (response.ok) {
            const data = await response.json<[{ lat: string; lon: string }]>();
            if (data && data.length > 0) {
              const coords: GeoLocation = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };

              // Cache the result
              const cache = getCache();
              cache[locationKey] = coords;
              newLocations.set(locationKey, coords);
              cacheUpdated = true;
            } else {
              // No results found, cache as null to avoid repeated lookups
              const cache = getCache();
              cache[locationKey] = null;
              cacheUpdated = true;
            }
          }
        } catch (error) {
          console.error(
            `Failed to geocode ${location.city}, ${location.country}:`,
            error,
          );
          // Cache as null on error
          const cache = getCache();
          cache[locationKey] = null;
          cacheUpdated = true;
        }

        // Add a delay between requests to be respectful to the free API
        if (hasNewRequests) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (cacheUpdated) {
        saveCache(getCache());
      }

      setGeocodedLocations(newLocations);
      setIsLoading(false);
    };

    geocodeLocations();
  }, [locationsKey]);

  return { geocodedLocations, isLoading };
}

export function getLocationKey(location: {
  country?: string | null;
  city?: string | null;
}) {
  return `${location.city || ""}::${location.country || ""}`;
}
