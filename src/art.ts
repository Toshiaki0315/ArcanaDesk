/**
 * カード表面の中央に描く絵 (オリジナルの SVG)。
 *
 * - すべて viewBox 0 0 100 100。線は currentColor なので、CSS の color (スート色など) に従う。
 * - class="fill"   … 薄い塗り (CSS で fill-opacity を指定)
 * - class="solid"  … 塗りつぶし
 * - class="accent" … アクセント色 (金) にする要素
 * - 外部入力を含まない固定の文字列なので innerHTML に入れてよい。
 */
import type { Card, Suit } from "./api";
import { MAJOR_ART } from "./art-major";
import { starPoints } from "./art-geometry";

type MinorSuit = Exclude<Suit, "MajorArcana">;

const MAJOR_COUNT = 22;
const RANKS_PER_SUIT = 14;

const svg = (attrs: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true" ` +
  `fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ` +
  `stroke-linejoin="round" ${attrs}>${body}</svg>`;

/* ---- スートの紋章 (-10〜10 の座標で描く) ---- */

const EMBLEMS: Record<MinorSuit, string> = {
  Wands:
    `<rect class="fill" x="-1.6" y="-10" width="3.2" height="20" rx="1.6"/>` +
    `<path class="fill" d="M1.6 -4 q4.5 -1.5 5.5 -5.5 q-4.5 0.5 -5.5 3.5Z"/>` +
    `<path class="fill" d="M-1.6 3 q-4.5 -1.5 -5.5 -5.5 q4.5 0.5 5.5 3.5Z"/>`,
  Cups:
    `<path class="fill" d="M-7 -9 H7 Q7 1 0 2.5 Q-7 1 -7 -9Z"/>` +
    `<path d="M0 2.5 V7"/>` +
    `<ellipse class="fill" cx="0" cy="8.5" rx="5" ry="1.6"/>`,
  Swords:
    `<path class="fill" d="M0 -10.5 L1.9 -7 V4.5 H-1.9 V-7Z"/>` +
    `<path d="M-6 4.5 H6"/>` +
    `<path d="M0 4.5 V8.5"/>` +
    `<circle class="solid" cx="0" cy="9.8" r="1.4"/>`,
  Pentacles:
    `<circle class="fill" cx="0" cy="0" r="9.5"/>` +
    `<polygon points="${starPoints(0, 0, 7.5, 3, 5)}"/>`,
};

const emblem = (suit: MinorSuit, x: number, y: number, s: number) =>
  `<g class="pip" data-suit="${suit}" transform="translate(${x} ${y}) scale(${s})" ` +
  `stroke-width="${(2.2 / s).toFixed(2)}">${EMBLEMS[suit]}</g>`;

/* ---- 数札: 枚数ぶん紋章を並べる ---- */

const PIP_LAYOUTS: { scale: number; at: [number, number][] }[] = [
  { scale: 2.8, at: [[50, 50]] },
  { scale: 1.6, at: [[50, 27], [50, 73]] },
  { scale: 1.35, at: [[50, 20], [50, 50], [50, 80]] },
  { scale: 1.45, at: [[31, 28], [69, 28], [31, 72], [69, 72]] },
  { scale: 1.3, at: [[30, 24], [70, 24], [50, 50], [30, 76], [70, 76]] },
  { scale: 1.2, at: [[31, 20], [69, 20], [31, 50], [69, 50], [31, 80], [69, 80]] },
  { scale: 1.12, at: [[31, 18], [69, 18], [50, 34], [31, 50], [69, 50], [31, 82], [69, 82]] },
  {
    scale: 1.05,
    at: [[31, 17], [69, 17], [50, 33], [31, 50], [69, 50], [50, 67], [31, 83], [69, 83]],
  },
  {
    scale: 0.98,
    at: [[30, 15], [70, 15], [30, 38], [70, 38], [50, 50], [30, 62], [70, 62], [30, 85], [70, 85]],
  },
  {
    scale: 0.95,
    at: [
      [30, 13], [70, 13], [50, 27], [30, 38], [70, 38],
      [30, 62], [70, 62], [50, 73], [30, 87], [70, 87],
    ],
  },
];

/* ---- 人物札: 大きな紋章 + 上に階級の印 ---- */

const COURT_RANKS = ["page", "knight", "queen", "king"] as const;

const BADGES: Record<(typeof COURT_RANKS)[number], string> = {
  // 開いた本
  page: `<path class="fill" d="M0 -4 Q-5 -7 -9 -5 V6 Q-5 4 0 7 Q5 4 9 6 V-5 Q5 -7 0 -4Z M0 -4 V7"/>`,
  // 盾
  knight: `<path class="fill" d="M-7 -8 H7 V0 Q7 7 0 10 Q-7 7 -7 0Z"/><path d="M0 -8 V10 M-7 -1 H7"/>`,
  // ティアラ
  queen:
    `<path class="fill" d="M-9 6 H9 L8 -1 Q4 3 0 -5 Q-4 3 -8 -1Z"/>` +
    `<circle class="solid" cx="0" cy="-7.5" r="1.8"/>`,
  // 王冠
  king:
    `<path class="fill" d="M-9 7 H9 V-3 L5 1.5 L0 -7 L-5 1.5 L-9 -3Z"/>` +
    `<circle class="solid" cx="0" cy="-8.5" r="1.6"/>` +
    `<circle class="solid" cx="-9" cy="-4.5" r="1.4"/>` +
    `<circle class="solid" cx="9" cy="-4.5" r="1.4"/>`,
};

function minorArt(suit: MinorSuit, rank: number): string {
  if (rank < PIP_LAYOUTS.length) {
    const { scale, at } = PIP_LAYOUTS[rank];
    return svg(`data-suit="${suit}"`, at.map(([x, y]) => emblem(suit, x, y, scale)).join(""));
  }
  const court = COURT_RANKS[rank - PIP_LAYOUTS.length];
  const badge =
    `<g class="rank-badge accent" data-rank="${court}" transform="translate(50 17) scale(1.3)" ` +
    `stroke-width="1.7">${BADGES[court]}</g>`;
  return svg(`data-suit="${suit}"`, badge + emblem(suit, 50, 62, 2.4));
}

export function cardArt(card: Card): string {
  if (card.suit === "MajorArcana") {
    return svg(`data-major="${card.id}"`, MAJOR_ART[card.id]);
  }
  return minorArt(card.suit, (card.id - MAJOR_COUNT) % RANKS_PER_SUIT);
}
