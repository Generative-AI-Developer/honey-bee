import { describe, expect, it } from "vitest";
import { describeInterval, fromIntervalSeconds, toIntervalSeconds } from "@/lib/interval";

// Slider timing typed by the admin (number + seconds/minutes), stored in seconds.
describe("slider intervals", () => {
  it("converts what the admin types into seconds", () => {
    expect(toIntervalSeconds("5", "seconds")).toEqual({ seconds: 5 });
    expect(toIntervalSeconds("30", "seconds")).toEqual({ seconds: 30 });
    expect(toIntervalSeconds("1", "minutes")).toEqual({ seconds: 60 });
    expect(toIntervalSeconds("2", "minutes")).toEqual({ seconds: 120 });
    expect(toIntervalSeconds("1.5", "minutes")).toEqual({ seconds: 90 });
    expect(toIntervalSeconds("0,5", "minutes")).toEqual({ seconds: 30 });
  });

  it("rejects values that are empty, too short or too long", () => {
    for (const [v, u] of [["", "seconds"], ["abc", "seconds"], ["0", "seconds"], ["1", "seconds"], ["61", "minutes"], ["3601", "seconds"]] as const) {
      expect(toIntervalSeconds(v, u)).toHaveProperty("error");
    }
    expect(toIntervalSeconds("60", "minutes")).toEqual({ seconds: 3600 });
  });

  it("shows saved values in the natural unit", () => {
    expect(fromIntervalSeconds(5)).toEqual({ value: "5", unit: "seconds" });
    expect(fromIntervalSeconds(120)).toEqual({ value: "2", unit: "minutes" });
    expect(fromIntervalSeconds(90)).toEqual({ value: "90", unit: "seconds" });
    expect(describeInterval(1)).toBe("1 second");
    expect(describeInterval(10)).toBe("10 seconds");
    expect(describeInterval(60)).toBe("1 minute");
    expect(describeInterval(150)).toBe("2 min 30 s");
  });
});
