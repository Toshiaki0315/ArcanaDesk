import { invoke } from "@tauri-apps/api/core";

// Rust 側 (src-tauri/src/spread.rs, tarot.rs) の JSON 表現と一致させること
export type SpreadType = "one_oracle" | "three_card" | "celtic_cross";
export type Suit = "Wands" | "Cups" | "Swords" | "Pentacles" | "MajorArcana";

export interface Card {
  id: number;
  name: string;
  suit: Suit;
  is_reversed: boolean;
}

export interface DrawnCard {
  position: number;
  position_name: string;
  card: Card;
}

export interface Reading {
  spread: SpreadType;
  cards: DrawnCard[];
}

export interface DrawResult {
  reading: Reading;
  /** 履歴保存に失敗した場合のメッセージ (占い自体は成功している) */
  history_error: string | null;
}

export interface HistoryEntry {
  id: number;
  /** UNIX エポックからのミリ秒 */
  created_at: number;
  reading: Reading;
}

export const SPREADS: { type: SpreadType; label: string }[] = [
  { type: "one_oracle", label: "ワンオラクル" },
  { type: "three_card", label: "スリーカード" },
  { type: "celtic_cross", label: "ケルト十字" },
];

export function orientationLabel(card: Card): string {
  return card.is_reversed ? "逆位置" : "正位置";
}

export function spreadLabel(spread: SpreadType): string {
  return SPREADS.find((s) => s.type === spread)!.label;
}

/** Rust の `draw_reading` コマンドを呼び、スプレッドを展開する (結果は履歴に自動保存される)。 */
export function drawReading(spread: SpreadType): Promise<DrawResult> {
  return invoke<DrawResult>("draw_reading", { spread });
}

/** 履歴を新しい順に取得する。 */
export function listHistory(): Promise<HistoryEntry[]> {
  return invoke<HistoryEntry[]>("list_history");
}

/** 削除できたら true。 */
export function deleteHistory(id: number): Promise<boolean> {
  return invoke<boolean>("delete_history", { id });
}

export function clearHistory(): Promise<void> {
  return invoke<void>("clear_history");
}
