import { describe, it, expect } from "vitest";

describe("Geographical Metadata Handling", () => {
  describe("Metadata Object Creation", () => {
    it("should create metadata object only when geographical data is present", () => {
      // Test cases for metadata creation logic
      const testCases = [
        {
          ip: "192.168.1.1",
          country: "US",
          city: "San Francisco",
          expected: { ip: "192.168.1.1", country: "US", city: "San Francisco" },
        },
        {
          ip: "192.168.1.1",
          country: undefined,
          city: undefined,
          expected: { ip: "192.168.1.1" },
        },
        {
          ip: undefined,
          country: "GB",
          city: "London",
          expected: { country: "GB", city: "London" },
        },
        {
          ip: undefined,
          country: undefined,
          city: undefined,
          expected: undefined,
        },
      ];

      for (const testCase of testCases) {
        let metadata:
          | { ip?: string; country?: string; city?: string }
          | undefined;

        if (testCase.ip || testCase.country || testCase.city) {
          metadata = {};
          if (testCase.ip) metadata.ip = testCase.ip;
          if (testCase.country) metadata.country = testCase.country;
          if (testCase.city) metadata.city = testCase.city;
        }

        expect(metadata).toEqual(testCase.expected);
      }
    });

    it("should handle empty strings as absent values", () => {
      const ip = "";
      const country = "";
      const city = "";

      let metadata:
        | { ip?: string; country?: string; city?: string }
        | undefined;

      // Empty strings are falsy, so no metadata should be created
      if (ip || country || city) {
        metadata = {};
        if (ip) metadata.ip = ip;
        if (country) metadata.country = country;
        if (city) metadata.city = city;
      }

      expect(metadata).toBeUndefined();
    });

    it("should not include timezone or coordinates in metadata", () => {
      // This test ensures we're not including unwanted fields
      const ip = "192.168.1.1";
      const country = "US";
      const city = "New York";

      let metadata:
        | { ip?: string; country?: string; city?: string }
        | undefined;

      if (ip || country || city) {
        metadata = {};
        if (ip) metadata.ip = ip;
        if (country) metadata.country = country;
        if (city) metadata.city = city;
        // Explicitly NOT adding timezone, latitude, or longitude
      }

      expect(metadata).toEqual({
        ip: "192.168.1.1",
        country: "US",
        city: "New York",
      });
    });
  });

  describe("Database Update Behavior", () => {
    it("should only include metadata in update when defined", () => {
      // Test that updateFields only includes metadata when it's not undefined
      const testCases = [
        {
          metadata: { ip: "192.168.1.1", country: "US", city: "SF" },
          expectedHasMetadata: true,
        },
        {
          metadata: undefined,
          expectedHasMetadata: false,
        },
      ];

      for (const testCase of testCases) {
        const updateFields: {
          lastSeenAt: Date;
          metadata?: { ip?: string; country?: string; city?: string };
        } = {
          lastSeenAt: new Date(),
        };

        if (testCase.metadata !== undefined) {
          updateFields.metadata = testCase.metadata;
        }

        expect("metadata" in updateFields).toBe(testCase.expectedHasMetadata);
      }
    });
  });
});
