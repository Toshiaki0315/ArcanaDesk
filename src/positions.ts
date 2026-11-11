import type { SpreadType } from "./api";

/** 各位置が表すもの。並びは Rust の SpreadType::position_names() と同じ。 */
const DESCRIPTIONS: Record<SpreadType, string[]> = {
  one_oracle: ["今のあなたに届いたメッセージ"],
  three_card: [
    "これまでの流れや、今に至る原因",
    "今あなたが置かれている状況",
    "このまま進んだ場合の行方",
  ],
  celtic_cross: [
    "今あなたが置かれている状況",
    "現状に立ちはだかる問題や課題",
    "はっきり意識している目標や考え",
    "心の奥にある本音や、物事の土台",
    "過ぎ去りつつある過去の影響",
    "近いうちに起こりそうなこと",
    "この問題に向き合うあなたの姿勢",
    "周りの人や環境から受ける影響",
    "心の中の願い、あるいは恐れ",
    "このまま進んだ場合の結末",
  ],
};

/** スプレッドの各位置が何を表すか (吹き出しの解説用)。範囲外なら空文字。 */
export function positionDescription(spread: SpreadType, position: number): string {
  return DESCRIPTIONS[spread][position] ?? "";
}
