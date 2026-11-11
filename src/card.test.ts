import { describe, expect, it } from "vitest";
import { cardNumeral, suitSymbol, toRoman } from "./card";
import type { Card } from "./api";

const card = (id: number, name: string, suit: Card["suit"]): Card => ({
  id,
  name,
  suit,
  is_reversed: false,
});

describe("toRoman", () => {
  it.each([
    [1, "I"],
    [4, "IV"],
    [9, "IX"],
    [10, "X"],
    [14, "XIV"],
    [19, "XIX"],
    [21, "XXI"],
  ])("converts %i to %s", (n, roman) => {
    expect(toRoman(n)).toBe(roman);
  });

  it("returns 0 for zero (The Fool)", () => {
    expect(toRoman(0)).toBe("0");
  });
});

describe("cardNumeral", () => {
  it("uses Roman numerals for the Major Arcana (id = number)", () => {
    expect(cardNumeral(card(0, "The Fool", "MajorArcana"))).toBe("0");
    expect(cardNumeral(card(13, "Death", "MajorArcana"))).toBe("XIII");
    expect(cardNumeral(card(21, "The World", "MajorArcana"))).toBe("XXI");
  });

  it("uses the rank for the Minor Arcana", () => {
    expect(cardNumeral(card(22, "Ace of Wands", "Wands"))).toBe("A");
    expect(cardNumeral(card(38, "Three of Cups", "Cups"))).toBe("3");
    expect(cardNumeral(card(59, "Ten of Swords", "Swords"))).toBe("10");
    expect(cardNumeral(card(74, "Page of Pentacles", "Pentacles"))).toBe("P");
    expect(cardNumeral(card(75, "Knight of Pentacles", "Pentacles"))).toBe("Kn");
    expect(cardNumeral(card(76, "Queen of Pentacles", "Pentacles"))).toBe("Q");
    expect(cardNumeral(card(77, "King of Pentacles", "Pentacles"))).toBe("K");
  });
});

describe("suitSymbol", () => {
  it("gives every suit a distinct symbol", () => {
    const suits: Card["suit"][] = ["Wands", "Cups", "Swords", "Pentacles", "MajorArcana"];
    const symbols = suits.map(suitSymbol);
    expect(new Set(symbols).size).toBe(5);
    expect(symbols.every((s) => s.length > 0)).toBe(true);
  });
});
