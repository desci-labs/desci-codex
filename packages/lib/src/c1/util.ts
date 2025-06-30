/**
 * Walks an array of rows backwards, propagating the last seen 'before' timestamp to previous events.
 * This because only time events have a timestamp, but for DX we want to include the timestamp for each version.
 */
export function propagateAnchorTimeToRows<
  T extends { event_type: 0 | 1; before: number | null },
>(rows: T[]): T[] {
  let lastAnchor: number | null = null;
  const result: T[] = new Array(rows.length);

  // Iterate from the latest known event...
  for (let i = rows.length - 1; i >= 0; i--) {
    // if this has a timestamp, set it as the current anchor
    if (rows[i].before !== null) {
      lastAnchor = rows[i].before;
    }
    // set the last anchor for all events, until the previous anchor is found
    result[i] = { ...rows[i], before: lastAnchor };
  }

  // Remove time events as they don't correspond to author updates
  return result.filter((row) => row.event_type === 0);
}
