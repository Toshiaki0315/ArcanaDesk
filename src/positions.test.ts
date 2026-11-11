import { describe, expect, it } from "vitest";
import { positionDescription } from "./positions";

// Rust の SpreadType::position_names() の枚数と一致させる
const COUNTS = { one_oracle: 1, three_card: 3, celtic_cross: 10 } as const;

describe("positionDescription", () => {
  it("describes every position of every spread", () => {
    for (const [spread, count] of Object.entries(COUNTS)) {
      for (let i = 0; i < count; i++) {
        const text = positionDescription(spread as keyof typeof COUNTS, i);
        expect(text.length, `${spread} ${i}`).toBeGreaterThan(0);
      }
    }
  });

  it("gives each Celtic cross position its own description", () => {
    const texts = Array.from({ length: 10 }, (_, i) => positionDescription("celtic_cross", i));
    expect(new Set(texts).size).toBe(10);
  });

  it("describes known positions", () => {
    expect(positionDescription("three_card", 0)).toContain("これまで");
    expect(positionDescription("celtic_cross", 1)).toContain("問題");
    expect(positionDescription("celtic_cross", 9)).toContain("結末");
  });

  it("returns an empty string for a position outside the spread", () => {
    expect(positionDescription("one_oracle", 5)).toBe("");
  });
});
