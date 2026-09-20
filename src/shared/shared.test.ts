import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "./concurrency";
import { formatRelativeTime } from "./format";

describe("formatRelativeTime", () => {
  const now = Date.UTC(2026, 8, 20, 12);
  it("formats past times", () => {
    expect(formatRelativeTime(now - 10_000, now)).toBe("just now");
    expect(formatRelativeTime(now - 3 * 3600_000, now)).toBe("3 hours ago");
    expect(formatRelativeTime(now - 24 * 3600_000, now)).toBe("yesterday");
    expect(formatRelativeTime(now - 40 * 24 * 3600_000, now)).toBe("last month");
  });
});

describe("mapWithConcurrency", () => {
  it("processes every item without exceeding the limit", async () => {
    let active = 0;
    let peak = 0;
    const seen: number[] = [];
    await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 2));
      seen.push(n);
      active--;
    });
    expect(peak).toBeLessThanOrEqual(3);
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
