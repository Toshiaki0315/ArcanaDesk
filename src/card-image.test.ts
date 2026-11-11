import { afterEach, describe, expect, it } from "vitest";
import type { Card } from "./api";
import { cardImageUrl, setCardImages } from "./card-image";

// テストは画像を用意していない状態を前提にする (画像は git 管理外で、各自が用意するもの)。
// 画像は起動時に Rust から data URL で受け取るので、ここではそれを模して渡す。

const card = (id: number, is_reversed = false): Card => ({
  id,
  name: `card ${id}`,
  suit: "MajorArcana",
  is_reversed,
});

const images = (entries: Record<number, string>) =>
  Array.from({ length: 78 }, (_, id) => entries[id] ?? null);

afterEach(() => setCardImages([]));

describe("cardImageUrl", () => {
  it("returns null before any images are loaded", () => {
    expect(cardImageUrl(card(0))).toBeNull();
    expect(cardImageUrl(card(77))).toBeNull();
  });

  it("returns the loaded image for each card", () => {
    setCardImages(images({ 0: "data:image/png;base64,AAA", 36: "data:image/png;base64,BBB" }));
    expect(cardImageUrl(card(0))).toBe("data:image/png;base64,AAA");
    expect(cardImageUrl(card(36))).toBe("data:image/png;base64,BBB");
  });

  it("returns null for cards without an image", () => {
    setCardImages(images({ 0: "data:image/png;base64,AAA" }));
    expect(cardImageUrl(card(1))).toBeNull();
  });

  it("does not depend on orientation", () => {
    setCardImages(images({ 5: "data:image/png;base64,CCC" }));
    expect(cardImageUrl(card(5, true))).toBe(cardImageUrl(card(5)));
  });

  it("replaces previously loaded images", () => {
    setCardImages(images({ 0: "data:image/png;base64,AAA" }));
    setCardImages(images({}));
    expect(cardImageUrl(card(0))).toBeNull();
  });
});
