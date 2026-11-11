import type { Card, Suit } from "./api";

const ROMAN: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** 大アルカナ番号 (0〜21) 用のローマ数字。0 は "0" を返す。 */
export function toRoman(n: number): string {
  if (n === 0) return "0";
  let out = "";
  for (const [value, symbol] of ROMAN) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out;
}

const MAJOR_COUNT = 22;
const MINOR_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "P", "Kn", "Q", "K"];

/** カード表面の隅に表示する番号。id の並びは Rust の Deck::new() に従う。 */
export function cardNumeral(card: Card): string {
  if (card.suit === "MajorArcana") return toRoman(card.id);
  return MINOR_RANKS[(card.id - MAJOR_COUNT) % MINOR_RANKS.length];
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  Wands: "♣",
  Cups: "♥",
  Swords: "♠",
  Pentacles: "♦",
  MajorArcana: "★",
};

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}
