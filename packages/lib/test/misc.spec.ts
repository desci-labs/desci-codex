import { describe, test, expect } from "vitest";
import { propagateAnchorTimeToRows } from "../src/c1/util.js";

describe("propagateAnchorTimeToRows", () => {
  test("propagates anchor timestamps backwards", () => {
    const rows = [
      { id: 1, event_type: 0, before: null } as const,
      { id: 2, event_type: 1, before: 100 } as const,
      { id: 3, event_type: 0, before: null } as const,
      { id: 4, event_type: 1, before: 200 } as const,
      { id: 5, event_type: 0, before: null } as const,
    ];
    const result = propagateAnchorTimeToRows(rows);
    expect(result).toEqual([
      { id: 1, event_type: 0, before: 100 },
      { id: 3, event_type: 0, before: 200 },
      { id: 5, event_type: 0, before: null },
    ]);
  });

  test("filters out all time events", () => {
    const rows = [
      { id: 1, event_type: 1, before: 10 } as const,
      { id: 2, event_type: 1, before: 20 } as const,
      { id: 3, event_type: 1, before: 30 } as const,
    ];
    const result = propagateAnchorTimeToRows(rows);
    expect(result).toEqual([]);
  });

  test("does nothing if there are no time events", () => {
    const rows = [
      { id: 1, event_type: 0, before: null } as const,
      { id: 2, event_type: 0, before: null } as const,
    ];
    const result = propagateAnchorTimeToRows(rows);
    expect(result).toEqual([
      { id: 1, event_type: 0, before: null },
      { id: 2, event_type: 0, before: null },
    ]);
  });

  test("accepts an empty array", () => {
    expect(propagateAnchorTimeToRows([])).toEqual([]);
  });
});
