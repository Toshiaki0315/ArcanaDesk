import { afterEach, describe, expect, it } from "vitest";
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import {
  clearHistory,
  deleteHistory,
  drawReading,
  listHistory,
  loadCardImages,
  orientationLabel,
  spreadLabel,
  SPREADS,
  type Card,
  type DrawResult,
  type HistoryEntry,
  type Reading,
} from "./api";

const fool: Card = { id: 0, name: "The Fool", suit: "MajorArcana", is_reversed: false };

const sample: Reading = {
  spread: "one_oracle",
  cards: [{ position: 0, position_name: "メッセージ", card: fool }],
};

const drawn: DrawResult = { reading: sample, history_error: null };

afterEach(() => clearMocks());

function recordCalls(response: unknown) {
  const calls: { cmd: string; args: unknown }[] = [];
  mockIPC((cmd, args) => {
    calls.push({ cmd, args });
    return response;
  });
  return calls;
}

describe("drawReading", () => {
  it("invokes the draw_reading command with the spread argument", async () => {
    const calls = recordCalls(drawn);

    const result = await drawReading("one_oracle");

    expect(calls).toEqual([{ cmd: "draw_reading", args: { spread: "one_oracle" } }]);
    expect(result).toEqual(drawn);
  });

  it("propagates backend errors", async () => {
    mockIPC(() => {
      throw new Error("unknown variant");
    });
    await expect(drawReading("celtic_cross")).rejects.toThrow("unknown variant");
  });
});

describe("SPREADS", () => {
  it("lists all three spreads with Japanese labels", () => {
    expect(SPREADS).toEqual([
      { type: "one_oracle", label: "ワンオラクル" },
      { type: "three_card", label: "スリーカード" },
      { type: "celtic_cross", label: "ケルト十字" },
    ]);
  });
});

describe("orientationLabel", () => {
  it("returns 正位置 for upright cards", () => {
    expect(orientationLabel(fool)).toBe("正位置");
  });
  it("returns 逆位置 for reversed cards", () => {
    expect(orientationLabel({ ...fool, is_reversed: true })).toBe("逆位置");
  });
});

describe("spreadLabel", () => {
  it("returns the Japanese label for each spread", () => {
    expect(spreadLabel("one_oracle")).toBe("ワンオラクル");
    expect(spreadLabel("celtic_cross")).toBe("ケルト十字");
  });
});

describe("history API", () => {
  const entry: HistoryEntry = { id: 3, created_at: 1_700_000_000_000, reading: sample };

  it("listHistory invokes list_history", async () => {
    const calls = recordCalls([entry]);
    expect(await listHistory()).toEqual([entry]);
    expect(calls).toEqual([{ cmd: "list_history", args: {} }]);
  });

  it("deleteHistory invokes delete_history with the id", async () => {
    const calls = recordCalls(true);
    expect(await deleteHistory(3)).toBe(true);
    expect(calls).toEqual([{ cmd: "delete_history", args: { id: 3 } }]);
  });

  it("clearHistory invokes clear_history", async () => {
    const calls = recordCalls(null);
    await clearHistory();
    expect(calls).toEqual([{ cmd: "clear_history", args: {} }]);
  });
});

describe("loadCardImages", () => {
  it("invokes card_images and returns the images", async () => {
    const list = [null, "data:image/png;base64,AAA"];
    const calls = recordCalls(list);
    expect(await loadCardImages()).toEqual(list);
    expect(calls).toEqual([{ cmd: "card_images", args: {} }]);
  });
});
