import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { armConfirm, formatDate, renderHistory, summarizeEntry } from "./history";
import type { HistoryEntry } from "./api";

// ローカルタイムで組み立てる (実行環境のタイムゾーンに依存しない)
const at = (y: number, mo: number, d: number, h: number, mi: number) =>
  new Date(y, mo - 1, d, h, mi).getTime();

const entries: HistoryEntry[] = [
  {
    id: 2,
    created_at: at(2026, 11, 11, 9, 5),
    reading: {
      spread: "three_card",
      cards: [
        { position: 0, position_name: "過去", card: { id: 0, name: "The Fool", suit: "MajorArcana", is_reversed: false } },
        { position: 1, position_name: "現在", card: { id: 36, name: "Ace of Cups", suit: "Cups", is_reversed: true } },
        { position: 2, position_name: "未来", card: { id: 21, name: "The World", suit: "MajorArcana", is_reversed: false } },
      ],
    },
  },
  {
    id: 1,
    created_at: at(2026, 1, 2, 23, 59),
    reading: {
      spread: "one_oracle",
      cards: [
        { position: 0, position_name: "メッセージ", card: { id: 17, name: "The Star", suit: "MajorArcana", is_reversed: true } },
      ],
    },
  },
];

describe("formatDate", () => {
  it("formats as YYYY/MM/DD HH:mm with zero padding", () => {
    expect(formatDate(at(2026, 1, 2, 3, 4))).toBe("2026/01/02 03:04");
    expect(formatDate(at(2026, 11, 11, 18, 47))).toBe("2026/11/11 18:47");
  });
});

describe("summarizeEntry", () => {
  it("lists Japanese card names, marking reversed cards with （逆）", () => {
    expect(summarizeEntry(entries[0])).toBe("愚者 / カップのエース（逆） / 世界");
  });

  it("abbreviates long spreads after three cards", () => {
    const celtic: HistoryEntry = {
      id: 9,
      created_at: 0,
      reading: {
        spread: "celtic_cross",
        cards: Array.from({ length: 10 }, (_, i) => ({
          position: i,
          position_name: `p${i}`,
          card: { id: i, name: `C${i}`, suit: "MajorArcana" as const, is_reversed: false },
        })),
      },
    };
    expect(summarizeEntry(celtic)).toBe("愚者 / 魔術師 / 女教皇 ほか7枚");
  });
});

describe("renderHistory", () => {
  let list: HTMLElement;
  const handlers = () => ({ onOpen: vi.fn(), onDelete: vi.fn() });

  beforeEach(() => {
    list = document.createElement("ul");
  });

  it("renders one item per entry with date, spread and summary", () => {
    renderHistory(list, entries, handlers());
    const items = list.querySelectorAll(".history-item");
    expect(items).toHaveLength(2);
    expect(items[0].querySelector(".history-date")?.textContent).toBe("2026/11/11 09:05");
    expect(items[0].querySelector(".history-spread")?.textContent).toBe("スリーカード");
    expect(items[0].querySelector(".history-summary")?.textContent).toBe(
      "愚者 / カップのエース（逆） / 世界",
    );
    expect(items[1].querySelector(".history-spread")?.textContent).toBe("ワンオラクル");
  });

  it("shows an empty message when there is no history", () => {
    renderHistory(list, [], handlers());
    expect(list.querySelectorAll(".history-item")).toHaveLength(0);
    expect(list.querySelector(".history-empty")?.textContent).toBe("まだ履歴はありません");
  });

  it("calls onOpen with the entry when its open button is clicked", () => {
    const h = handlers();
    renderHistory(list, entries, h);
    list.querySelectorAll<HTMLButtonElement>(".history-open")[1].click();
    expect(h.onOpen).toHaveBeenCalledWith(entries[1]);
    expect(h.onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete with the entry when its delete button is clicked", () => {
    const h = handlers();
    renderHistory(list, entries, h);
    list.querySelector<HTMLButtonElement>(".history-delete")!.click();
    expect(h.onDelete).toHaveBeenCalledWith(entries[0]);
    expect(h.onOpen).not.toHaveBeenCalled();
  });

  it("gives the delete button an accessible label naming the date", () => {
    renderHistory(list, entries, handlers());
    expect(list.querySelector(".history-delete")?.getAttribute("aria-label")).toBe(
      "2026/11/11 09:05 の履歴を削除",
    );
  });

  it("replaces previous content", () => {
    renderHistory(list, entries, handlers());
    renderHistory(list, entries.slice(1), handlers());
    expect(list.querySelectorAll(".history-item")).toHaveLength(1);
  });
});

describe("armConfirm", () => {
  let button: HTMLButtonElement;
  let action: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    button = document.createElement("button");
    button.textContent = "すべて削除";
    action = vi.fn<() => void>();
    armConfirm(button, "本当に削除しますか？", action);
  });
  afterEach(() => vi.useRealTimers());

  it("does not run the action on the first click, but asks for confirmation", () => {
    button.click();
    expect(action).not.toHaveBeenCalled();
    expect(button.textContent).toBe("本当に削除しますか？");
    expect(button.classList.contains("confirming")).toBe(true);
  });

  it("runs the action on a second click and restores the label", () => {
    button.click();
    button.click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(button.textContent).toBe("すべて削除");
    expect(button.classList.contains("confirming")).toBe(false);
  });

  it("disarms after the timeout", () => {
    button.click();
    vi.advanceTimersByTime(3000);
    expect(button.textContent).toBe("すべて削除");
    button.click();
    expect(action).not.toHaveBeenCalled();
    expect(button.textContent).toBe("本当に削除しますか？");
  });

  it("does not let a stale timer reset a later confirmation", () => {
    button.click(); // t=0: 確認待ち (タイマー A: t=3000)
    vi.advanceTimersByTime(1000);
    button.click(); // t=1000: 実行 → タイマー A は解除されるべき
    vi.advanceTimersByTime(1000);
    button.click(); // t=2000: 再び確認待ち (タイマー B: t=5000)
    vi.advanceTimersByTime(1500); // t=3500: タイマー A が残っていればここで解除されてしまう
    expect(button.classList.contains("confirming")).toBe(true);
    button.click();
    expect(action).toHaveBeenCalledTimes(2);
  });
});
