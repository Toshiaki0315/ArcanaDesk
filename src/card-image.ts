import type { Card } from "./api";

/**
 * カードのドット絵の URL (public/cards/NN.png、NN はカード id)。
 * 絵は 1909 年のライダー版 (パブリックドメイン) を scripts/pixelate-cards.py で変換したもの。
 */
export function cardImageUrl(card: Card): string {
  return `/cards/${String(card.id).padStart(2, "0")}.png`;
}
