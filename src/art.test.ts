import { describe, expect, it } from "vitest";
import type { Card, Suit } from "./api";
import { cardArt } from "./art";

const MINOR_SUITS = ["Wands", "Cups", "Swords", "Pentacles"] as const satisfies Suit[];

/** Rust の Deck::new() と同じ並び (id 0〜21 大アルカナ、以降 14 枚ずつ) */
const allCards: Card[] = Array.from({ length: 78 }, (_, id) => ({
  id,
  name: `card ${id}`,
  suit: id < 22 ? "MajorArcana" : MINOR_SUITS[Math.floor((id - 22) / 14)],
  is_reversed: false,
}));

const parse = (svg: string) =>
  new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;

/** スート s のランク r (0 = エース … 13 = キング) */
const minor = (s: (typeof MINOR_SUITS)[number], r: number) =>
  allCards[22 + MINOR_SUITS.indexOf(s) * 14 + r];

describe("cardArt", () => {
  it("returns well-formed, decorative SVG for every card", () => {
    for (const card of allCards) {
      const root = parse(cardArt(card));
      expect(root.nodeName, `id ${card.id}`).toBe("svg");
      expect(root.querySelector("parsererror"), `id ${card.id}`).toBeNull();
      expect(root.getAttribute("viewBox")).toBe("0 0 100 100");
      expect(root.getAttribute("aria-hidden")).toBe("true");
      expect(root.children.length, `id ${card.id} is empty`).toBeGreaterThan(0);
    }
  });

  it("draws a different picture for each of the 78 cards", () => {
    expect(new Set(allCards.map(cardArt)).size).toBe(78);
  });

  it("does not depend on orientation", () => {
    expect(cardArt({ ...allCards[5], is_reversed: true })).toBe(cardArt(allCards[5]));
  });

  it("tags each Major Arcana picture with its number", () => {
    for (let id = 0; id < 22; id++) {
      expect(parse(cardArt(allCards[id])).getAttribute("data-major")).toBe(String(id));
    }
  });

  it("draws as many suit emblems as the number on pip cards (Ace–10)", () => {
    for (const suit of MINOR_SUITS) {
      for (let rank = 0; rank < 10; rank++) {
        const pips = parse(cardArt(minor(suit, rank))).querySelectorAll(".pip");
        expect(pips, `${suit} ${rank + 1}`).toHaveLength(rank + 1);
        pips.forEach((p) => expect(p.getAttribute("data-suit")).toBe(suit));
      }
    }
  });

  it("draws one emblem plus a rank badge on court cards", () => {
    const ranks = ["page", "knight", "queen", "king"];
    for (const suit of MINOR_SUITS) {
      ranks.forEach((rank, i) => {
        const root = parse(cardArt(minor(suit, 10 + i)));
        expect(root.querySelectorAll(".pip"), `${suit} ${rank}`).toHaveLength(1);
        expect(root.querySelector(".rank-badge")?.getAttribute("data-rank")).toBe(rank);
      });
    }
  });
});
