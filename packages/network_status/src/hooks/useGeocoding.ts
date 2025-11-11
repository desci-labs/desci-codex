import { useEffect, useState } from "react";

interface GeoLocation {
  lat: number;
  lng: number;
}

interface LocationCache {
  [key: string]: GeoLocation | null;
}

// Cache key for localStorage
const CACHE_KEY = "codex_geocoding_cache";
const CACHE_VERSION = "v1";
// Unlimited TTL - city coordinates don't change
// Cache will only be invalidated by version change

// Load cache from localStorage on module initialization
const loadCache = (): LocationCache => {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only check version, ignore timestamp for unlimited TTL
      if (parsed.version === CACHE_VERSION) {
        return parsed.data || {};
      }
    }
  } catch (error) {
    console.error("Failed to load geocoding cache:", error);
  }
  return {};
};

// Save cache to localStorage
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

// Initialize cache from localStorage
const locationCache: LocationCache = loadCache();

/**
 * Custom hook to geocode country+city to coordinates using Nominatim (OpenStreetMap)
 * This maintains user privacy by not exposing IPs or exact coordinates from the database
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

  // React Compiler will automatically memoize this stable computation
  // No need for useMemo - the compiler handles it
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
        if (locationCache[locationKey] !== undefined) {
          if (locationCache[locationKey]) {
            newLocations.set(locationKey, locationCache[locationKey]!);
          }
          continue;
        }

        // Mark that we have new requests to make
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
                "User-Agent": "Codex Network Status Dashboard",
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const coords: GeoLocation = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };

              // Cache the result
              locationCache[locationKey] = coords;
              newLocations.set(locationKey, coords);
              cacheUpdated = true;
            } else {
              // No results found, cache as null to avoid repeated lookups
              locationCache[locationKey] = null;
              cacheUpdated = true;
            }
          }
        } catch (error) {
          console.error(
            `Failed to geocode ${location.city}, ${location.country}:`,
            error,
          );
          // Cache as null on error
          locationCache[locationKey] = null;
          cacheUpdated = true;
        }

        // Add a small delay between requests to be respectful to the free API
        if (hasNewRequests) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Save cache to localStorage if it was updated
      if (cacheUpdated) {
        saveCache(locationCache);
      }

      setGeocodedLocations(newLocations);
      setIsLoading(false);
    };

    geocodeLocations();
  }, [locationsKey]);

  return { geocodedLocations, isLoading };
}

/**
 * Helper function to create a location key
 */
export function getLocationKey(location: {
  country?: string | null;
  city?: string | null;
}) {
  return `${location.city || ""}::${location.country || ""}`;
}
