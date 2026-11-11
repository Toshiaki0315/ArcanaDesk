import { describe, expect, it } from "vitest";
import type { Card } from "./api";
import { cardImageUrl } from "./card-image";

// テストは画像を用意していない状態を前提にする (画像は git 管理外で、各自が用意するもの)。
// 画像の有無による表示の切り替えは render.test.ts で load / error イベントを使って確かめる。

const card = (id: number, is_reversed = false): Card => ({
  id,
  name: `card ${id}`,
  suit: "MajorArcana",
  is_reversed,
});

describe("cardImageUrl", () => {
  it("points to the zero-padded PNG for the card id", () => {
    expect(cardImageUrl(card(0))).toBe("/cards/00.png");
    expect(cardImageUrl(card(7))).toBe("/cards/07.png");
    expect(cardImageUrl(card(77))).toBe("/cards/77.png");
  });

  it("gives every card its own image regardless of orientation", () => {
    const urls = Array.from({ length: 78 }, (_, id) => cardImageUrl(card(id)));
    expect(new Set(urls).size).toBe(78);
    expect(cardImageUrl(card(5, true))).toBe(cardImageUrl(card(5)));
  });
});
