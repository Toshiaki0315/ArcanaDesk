import { describe, expect, it } from "vitest";
import type { Card, Suit } from "./api";
import { cardMeaning, cardNameJa, currentMeaning, MAJOR_MEANINGS, MINOR_MEANINGS } from "./meanings";

const MINOR_SUITS = ["Wands", "Cups", "Swords", "Pentacles"] as const satisfies Suit[];

/** Rust の Deck::new() と同じ並び (id 0〜21 大アルカナ、以降 14 枚ずつ) */
const allCards: Card[] = Array.from({ length: 78 }, (_, id) => ({
  id,
  name: `card ${id}`,
  suit: id < 22 ? "MajorArcana" : MINOR_SUITS[Math.floor((id - 22) / 14)],
  is_reversed: false,
}));

const byId = (id: number, is_reversed = false): Card => ({ ...allCards[id], is_reversed });

describe("meaning tables", () => {
  it("has 22 Major Arcana entries", () => {
    expect(MAJOR_MEANINGS).toHaveLength(22);
  });

  it("has 14 entries for each minor suit", () => {
    for (const suit of MINOR_SUITS) {
      expect(MINOR_MEANINGS[suit], suit).toHaveLength(14);
    }
  });
});

describe("cardNameJa", () => {
  it.each([
    [0, "愚者"],
    [1, "魔術師"],
    [12, "吊るされた男"],
    [13, "死神"],
    [21, "世界"],
    [22, "ワンドのエース"],
    [24, "ワンドの3"],
    [31, "ワンドの10"],
    [32, "ワンドのペイジ"],
    [33, "ワンドのナイト"],
    [34, "ワンドのクイーン"],
    [35, "ワンドのキング"],
    [36, "カップのエース"],
    [50, "ソードのエース"],
    [77, "ペンタクルのキング"],
  ])("id %i is %s", (id, name) => {
    expect(cardNameJa(byId(id))).toBe(name);
  });

  it("gives all 78 cards distinct names", () => {
    const names = allCards.map(cardNameJa);
    expect(names.every((n) => n.length > 0)).toBe(true);
    expect(new Set(names).size).toBe(78);
  });
});

describe("cardMeaning", () => {
  it("returns upright and reversed meanings for every card", () => {
    for (const card of allCards) {
      const m = cardMeaning(card);
      expect(m.upright.length, `id ${card.id} upright`).toBeGreaterThan(0);
      expect(m.reversed.length, `id ${card.id} reversed`).toBeGreaterThan(0);
      expect(m.upright).not.toBe(m.reversed);
    }
  });

  it("gives every card a distinct upright meaning", () => {
    expect(new Set(allCards.map((c) => cardMeaning(c).upright)).size).toBe(78);
  });

  it("maps known cards to their meanings", () => {
    expect(cardMeaning(byId(0)).upright).toContain("新しい始まり");
    expect(cardMeaning(byId(13)).upright).toContain("再生");
    expect(cardMeaning(byId(19)).upright).toContain("成功");
    expect(cardMeaning(byId(38)).upright).toContain("友情"); // カップの3
  });

  it("does not depend on orientation", () => {
    expect(cardMeaning(byId(5, true))).toEqual(cardMeaning(byId(5)));
  });
});

describe("currentMeaning", () => {
  it("returns the meaning for the card's orientation", () => {
    expect(currentMeaning(byId(17))).toBe(cardMeaning(byId(17)).upright);
    expect(currentMeaning(byId(17, true))).toBe(cardMeaning(byId(17)).reversed);
  });
});
