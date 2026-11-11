import {
  clearHistory,
  deleteHistory,
  drawReading,
  listHistory,
  loadCardImages,
  SPREADS,
  type HistoryEntry,
  type SpreadType,
} from "./api";
import { setCardImages } from "./card-image";
import { armConfirm, formatDate, renderHistory } from "./history";
import { renderReading, revealAll } from "./render";

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

function show(el: HTMLElement, text: string | null) {
  el.textContent = text ?? "";
  el.hidden = !text;
}

// カードのドット絵 (アプリのデータフォルダの cards/) を起動時に 1 回だけ読み込む。
// 読めなくても SVG の簡易版で動くので、失敗は無視する。
loadCardImages()
  .then(setCardImages)
  .catch(() => setCardImages([]));

window.addEventListener("DOMContentLoaded", () => {
  const form = $<HTMLFormElement>("#draw-form");
  const select = $<HTMLSelectElement>("#spread-select");
  const readingEl = $("#reading");
  const errorEl = $("#error");
  const warningEl = $("#warning");
  const captionEl = $("#reading-caption");
  const revealAllBtn = $<HTMLButtonElement>("#reveal-all");
  const historyList = $("#history-list");
  const historyCount = $("#history-count");
  const historyError = $("#history-error");
  const historyClear = $<HTMLButtonElement>("#history-clear");

  for (const { type, label } of SPREADS) {
    select.add(new Option(label, type));
  }

  async function refreshHistory() {
    try {
      const entries = await listHistory();
      show(historyError, null);
      historyCount.textContent = `(${entries.length})`;
      historyClear.hidden = entries.length === 0;
      renderHistory(historyList, entries, { onOpen: openEntry, onDelete: removeEntry });
    } catch (err) {
      show(historyError, `履歴を読み込めませんでした: ${err}`);
    }
  }

  function openEntry(entry: HistoryEntry) {
    renderReading(readingEl, entry.reading);
    revealAll(readingEl);
    revealAllBtn.hidden = true;
    show(captionEl, `${formatDate(entry.created_at)} の結果`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeEntry(entry: HistoryEntry) {
    try {
      await deleteHistory(entry.id);
    } catch (err) {
      show(historyError, `削除に失敗しました: ${err}`);
    }
    await refreshHistory();
  }

  revealAllBtn.addEventListener("click", () => revealAll(readingEl));

  armConfirm(historyClear, "本当に削除しますか？", async () => {
    try {
      await clearHistory();
    } catch (err) {
      show(historyError, `削除に失敗しました: ${err}`);
    }
    await refreshHistory();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    show(errorEl, null);
    try {
      const { reading, history_error } = await drawReading(select.value as SpreadType);
      renderReading(readingEl, reading);
      revealAllBtn.hidden = false;
      show(captionEl, null);
      show(warningEl, history_error && `履歴に保存できませんでした: ${history_error}`);
    } catch (err) {
      show(errorEl, `占いに失敗しました: ${err}`);
    }
    await refreshHistory();
  });

  refreshHistory();
});
