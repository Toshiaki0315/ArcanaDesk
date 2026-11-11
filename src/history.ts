import { spreadLabel, type HistoryEntry } from "./api";
import { cardNameJa } from "./meanings";

const pad = (n: number) => String(n).padStart(2, "0");

/** ローカルタイムで "YYYY/MM/DD HH:mm" 形式にする。 */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

const SUMMARY_LIMIT = 3;

/** 一覧に表示する 1 行要約。4 枚以上は先頭 3 枚 + 残り枚数。 */
export function summarizeEntry(entry: HistoryEntry): string {
  const names = entry.reading.cards.map(
    ({ card }) => cardNameJa(card) + (card.is_reversed ? "（逆）" : ""),
  );
  const head = names.slice(0, SUMMARY_LIMIT).join(" / ");
  const rest = names.length - SUMMARY_LIMIT;
  return rest > 0 ? `${head} ほか${rest}枚` : head;
}

export interface HistoryHandlers {
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function renderItem(entry: HistoryEntry, handlers: HistoryHandlers): HTMLElement {
  const date = formatDate(entry.created_at);
  const li = el("li", "history-item");

  const open = el("button", "history-open") as HTMLButtonElement;
  open.type = "button";
  open.append(
    el("span", "history-date", date),
    el("span", "history-spread", spreadLabel(entry.reading.spread)),
    el("span", "history-summary", summarizeEntry(entry)),
  );
  open.addEventListener("click", () => handlers.onOpen(entry));

  const del = el("button", "history-delete", "×") as HTMLButtonElement;
  del.type = "button";
  del.setAttribute("aria-label", `${date} の履歴を削除`);
  del.addEventListener("click", () => handlers.onDelete(entry));

  li.append(open, del);
  return li;
}

/** 履歴一覧を描画する (前回の内容は置き換える)。 */
export function renderHistory(
  list: HTMLElement,
  entries: HistoryEntry[],
  handlers: HistoryHandlers,
): void {
  if (entries.length === 0) {
    list.replaceChildren(el("li", "history-empty", "まだ履歴はありません"));
    return;
  }
  list.replaceChildren(...entries.map((e) => renderItem(e, handlers)));
}

/**
 * 破壊的な操作用の二度押し確認。1 回目のクリックで確認表示に切り替え、
 * timeoutMs 以内に再度クリックされたら action を実行する。
 */
export function armConfirm(
  button: HTMLButtonElement,
  confirmLabel: string,
  action: () => void,
  timeoutMs = 3000,
): void {
  const originalLabel = button.textContent;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const disarm = () => {
    clearTimeout(timer);
    timer = undefined;
    button.textContent = originalLabel;
    button.classList.remove("confirming");
  };

  button.addEventListener("click", () => {
    if (timer === undefined) {
      button.textContent = confirmLabel;
      button.classList.add("confirming");
      timer = setTimeout(disarm, timeoutMs);
      return;
    }
    disarm();
    action();
  });
}
