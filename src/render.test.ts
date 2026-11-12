import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderReading, revealAll, revealCard } from "./render";
import type { Reading } from "./api";
import { cardMeaning } from "./meanings";
import { positionDescription } from "./positions";
import { setCardImages } from "./card-image";

const reading: Reading = {
  spread: "three_card",
  cards: [
    { position: 0, position_name: "過去", card: { id: 0, name: "The Fool", suit: "MajorArcana", is_reversed: false } },
    { position: 1, position_name: "現在", card: { id: 36, name: "Ace of Cups", suit: "Cups", is_reversed: true } },
    { position: 2, position_name: "未来", card: { id: 21, name: "The World", suit: "MajorArcana", is_reversed: false } },
  ],
};

let container: HTMLElement;
beforeEach(() => {
  container = document.createElement("div");
});

describe("renderReading", () => {
  it("renders one card element per drawn card, in order", () => {
    renderReading(container, reading);
    const cards = container.querySelectorAll(".card");
    expect(cards).toHaveLength(3);
    expect([...cards].map((c) => c.querySelector(".card-position")?.textContent)).toEqual([
      "過去",
      "現在",
      "未来",
    ]);
  });

  it("shows the card name and orientation", () => {
    renderReading(container, reading);
    const second = container.querySelectorAll(".card")[1];
    expect(second.querySelector(".card-name")?.textContent).toBe("Ace of Cups");
    expect(second.querySelector(".card-orientation")?.textContent).toBe("逆位置");
  });

  it("marks reversed cards with a class and exposes data attributes", () => {
    renderReading(container, reading);
    const [first, second] = container.querySelectorAll<HTMLElement>(".card");
    expect(first.classList.contains("reversed")).toBe(false);
    expect(second.classList.contains("reversed")).toBe(true);
    expect(second.dataset.cardId).toBe("36");
    expect(second.dataset.suit).toBe("Cups");
  });

  it("tags the container with the spread type", () => {
    renderReading(container, reading);
    expect(container.dataset.spread).toBe("three_card");
  });

  it("replaces any previous reading", () => {
    renderReading(container, reading);
    renderReading(container, { spread: "one_oracle", cards: [reading.cards[0]] });
    expect(container.querySelectorAll(".card")).toHaveLength(1);
    expect(container.dataset.spread).toBe("one_oracle");
  });

  it("deals cards face down", () => {
    renderReading(container, reading);
    const cards = [...container.querySelectorAll(".card")];
    expect(cards.every((c) => !c.classList.contains("flipped"))).toBe(true);
    expect(cards.every((c) => c.querySelector(".card-back"))).toBe(true);
  });

  it("does not reveal the card name in the accessible label before flipping", () => {
    renderReading(container, reading);
    const button = container.querySelector<HTMLButtonElement>(".card-inner")!;
    expect(button.getAttribute("aria-label")).toBe("過去のカードをめくる");
  });

  it("sets a deal index for staggered animation", () => {
    renderReading(container, reading);
    const cards = container.querySelectorAll<HTMLElement>(".card");
    expect(cards[2].style.getPropertyValue("--deal-index")).toBe("2");
  });

  it("shows the Japanese name and the English name on the face", () => {
    renderReading(container, reading);
    const second = container.querySelectorAll(".card")[1];
    expect(second.querySelector(".card-name-ja")?.textContent).toBe("カップのエース");
    expect(second.querySelector(".card-name")?.textContent).toBe("Ace of Cups");
  });

  it("splits Japanese names after の so they wrap at natural points", () => {
    renderReading(container, reading);
    const [first, second] = container.querySelectorAll(".card");
    const parts = (c: Element) =>
      [...c.querySelectorAll(".card-name-ja > .name-part")].map((e) => e.textContent);
    expect(parts(second)).toEqual(["カップの", "エース"]);
    expect(parts(first)).toEqual(["愚者"]);
  });

  it("shows the meaning for each card's orientation", () => {
    renderReading(container, reading);
    const [first, second] = container.querySelectorAll(".card");
    expect(first.querySelector(".card-meaning")?.textContent).toBe(
      cardMeaning(reading.cards[0].card).upright,
    );
    expect(second.querySelector(".card-meaning")?.textContent).toBe(
      cardMeaning(reading.cards[1].card).reversed,
    );
  });

  describe("card pictures", () => {
    const PNG = (n: string) => `data:image/png;base64,${n}`;
    const withImages = (entries: Record<number, string>) =>
      setCardImages(Array.from({ length: 78 }, (_, id) => entries[id] ?? null));

    afterEach(() => setCardImages([]));

    it("shows only the simple SVG picture when no image was loaded at startup", () => {
      renderReading(container, reading);
      const faces = container.querySelectorAll<HTMLElement>(".card-face");
      faces.forEach((face) => {
        expect(face.querySelector("img")).toBeNull();
        expect(face.classList.contains("no-image")).toBe(true);
      });
      const art = faces[1].querySelector(".card-art > svg");
      expect(art?.getAttribute("data-suit")).toBe("Cups");
      expect(art?.querySelectorAll(".pip")).toHaveLength(1);
      expect(faces[0].querySelector(".card-art > svg")?.getAttribute("data-major")).toBe("0");
    });

    it("layers the loaded image over the SVG picture for cards that have one", () => {
      withImages({ 36: PNG("CUPS") });
      renderReading(container, reading);
      const [first, second] = container.querySelectorAll<HTMLElement>(".card-face");
      const img = second.querySelector<HTMLImageElement>("img.card-image");
      expect(img?.getAttribute("src")).toBe(PNG("CUPS"));
      // 名前は文字で表示しているので、画像は装飾扱い
      expect(img?.getAttribute("alt")).toBe("");
      expect(second.querySelector(".card-art > svg")).not.toBeNull();
      // 画像の無い札は SVG だけ
      expect(first.querySelector("img")).toBeNull();
      expect(first.classList.contains("no-image")).toBe(true);
    });

    it("uses the image once it loads", () => {
      withImages({ 0: PNG("FOOL") });
      renderReading(container, reading);
      const face = container.querySelector<HTMLElement>(".card-face")!;
      face.querySelector("img")!.dispatchEvent(new Event("load"));
      expect(face.classList.contains("has-image")).toBe(true);
      expect(face.classList.contains("no-image")).toBe(false);
    });

    it("falls back to the SVG picture if a loaded image cannot be shown", () => {
      withImages({ 36: PNG("BROKEN") });
      renderReading(container, reading);
      const face = container.querySelectorAll<HTMLElement>(".card-face")[1];
      face.querySelector("img")!.dispatchEvent(new Event("error"));
      expect(face.classList.contains("no-image")).toBe(true);
      expect(face.querySelector("img")).toBeNull();
      expect(face.querySelector(".card-art > svg")).not.toBeNull();
      // 番号と名前は残る
      expect(face.querySelector(".card-numeral")?.textContent).toBe("A");
      expect(face.querySelector(".card-name-ja")?.textContent).toBe("カップのエース");
    });
  });

  it("does not show any picture on the back before flipping", () => {
    renderReading(container, reading);
    expect(container.querySelector(".card-back img")).toBeNull();
    expect(container.querySelector(".card-back svg")).toBeNull();
  });

  it("shows numeral but no text suit symbol on the face", () => {
    renderReading(container, reading);
    const second = container.querySelectorAll(".card")[1];
    expect(second.querySelector(".card-numeral")?.textContent).toBe("A");
    expect(second.querySelector(".card-symbol")).toBeNull();
  });
});

describe("revealing cards", () => {
  beforeEach(() => renderReading(container, reading));

  it("flips a card when it is clicked", () => {
    const first = container.querySelector<HTMLElement>(".card")!;
    first.querySelector<HTMLButtonElement>(".card-inner")!.click();
    expect(first.classList.contains("flipped")).toBe(true);
    expect(container.querySelectorAll(".card.flipped")).toHaveLength(1);
  });

  it("is one-way: clicking a revealed card keeps it face up", () => {
    const first = container.querySelector<HTMLElement>(".card")!;
    const button = first.querySelector<HTMLButtonElement>(".card-inner")!;
    button.click();
    button.click();
    expect(first.classList.contains("flipped")).toBe(true);
  });

  it("updates the accessible label with the card once revealed", () => {
    const second = container.querySelectorAll<HTMLElement>(".card")[1];
    revealCard(second);
    expect(second.querySelector(".card-inner")?.getAttribute("aria-label")).toBe(
      "現在: カップのエース（逆位置）",
    );
  });

  it("revealCard leaves an already revealed card as it is", () => {
    const second = container.querySelectorAll<HTMLElement>(".card")[1];
    revealCard(second);
    revealCard(second);
    expect(second.classList.contains("flipped")).toBe(true);
    expect(second.querySelector(".card-inner")?.getAttribute("aria-label")).toBe(
      "現在: カップのエース（逆位置）",
    );
  });

  it("revealAll flips every card", () => {
    revealAll(container);
    expect(container.querySelectorAll(".card.flipped")).toHaveLength(3);
  });
});

describe("spread layout", () => {
  beforeEach(() => renderReading(container, reading));

  it("puts cards in a list and tags each with its position", () => {
    const cards = container.querySelectorAll<HTMLElement>(".reading-cards > .card");
    expect([...cards].map((c) => c.dataset.position)).toEqual(["0", "1", "2"]);
  });

  it("shows a 1-based position number on each card", () => {
    const indexes = container.querySelectorAll(".card .card-index");
    expect([...indexes].map((e) => e.textContent)).toEqual(["1", "2", "3"]);
  });
});

describe("revealCard", () => {
  beforeEach(() => renderReading(container, reading));

  it("does not render a separate legend (positions are shown in the bubble)", () => {
    expect(container.querySelector(".reading-legend")).toBeNull();
  });

  it("revealing a detached card does not throw", () => {
    const card = container.querySelector<HTMLElement>(".card")!;
    card.remove();
    expect(() => revealCard(card)).not.toThrow();
    expect(card.classList.contains("flipped")).toBe(true);
  });
});

describe("explanation bubble", () => {
  let root: HTMLElement;
  const cards = () => [...root.querySelectorAll<HTMLElement>(".card")];
  const button = (i: number) => cards()[i].querySelector<HTMLButtonElement>(".card-inner")!;
  const bubble = () => root.querySelector<HTMLElement>(".card-bubble");
  const text = (sel: string) => bubble()?.querySelector(sel)?.textContent;

  beforeEach(() => {
    // document へのクリックや Esc キーを受け取るため、実際に DOM へ取り付ける
    root = document.createElement("div");
    document.body.append(root);
    renderReading(root, reading);
  });
  afterEach(() => root.remove());

  it("flips a face-down card on the first click without opening a bubble", () => {
    button(0).click();
    expect(cards()[0].classList.contains("flipped")).toBe(true);
    expect(bubble()).toBeNull();
  });

  it("opens a bubble when a face-up card is clicked", () => {
    revealAll(root);
    button(1).click();
    expect(bubble()).not.toBeNull();
    expect(bubble()?.getAttribute("role")).toBe("dialog");
    expect(bubble()?.getAttribute("aria-label")).toBe("カップのエースの解説");
    expect(button(1).getAttribute("aria-expanded")).toBe("true");
  });

  it("puts the position number and name at the top, as the heading", () => {
    revealAll(root);
    button(2).click();
    const first = bubble()!.firstElementChild!;
    expect(first.classList.contains("bubble-heading")).toBe(true);
    expect(first.querySelector(".bubble-index")?.textContent).toBe("3");
    expect(first.querySelector(".bubble-position-name")?.textContent).toBe("未来");
  });

  it("explains the card, its position and the meaning for its orientation", () => {
    revealAll(root);
    button(1).click();
    const { card } = reading.cards[1];
    expect(text(".bubble-title")).toBe("カップのエース（逆位置）");
    expect(text(".bubble-subtitle")).toBe("Ace of Cups");
    expect(text(".bubble-heading .bubble-index")).toBe("2");
    expect(text(".bubble-heading .bubble-position-name")).toBe("現在");
    expect(text(".bubble-position")).toBe(positionDescription("three_card", 1));
    expect(text(".bubble-meaning")).toBe(cardMeaning(card).reversed);
    expect(text(".bubble-other")).toBe(`正位置では: ${cardMeaning(card).upright}`);
  });

  it("shows the reversed meaning as the alternative for an upright card", () => {
    revealAll(root);
    button(0).click();
    const { card } = reading.cards[0];
    expect(text(".bubble-title")).toBe("愚者（正位置）");
    expect(text(".bubble-meaning")).toBe(cardMeaning(card).upright);
    expect(text(".bubble-other")).toBe(`逆位置では: ${cardMeaning(card).reversed}`);
  });

  it("closes the bubble when the same card is clicked again", () => {
    revealAll(root);
    button(1).click();
    button(1).click();
    expect(bubble()).toBeNull();
    expect(button(1).getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps only one bubble open, for the most recently clicked card", () => {
    revealAll(root);
    button(0).click();
    button(2).click();
    expect(root.querySelectorAll(".card-bubble")).toHaveLength(1);
    expect(text(".bubble-title")).toBe("世界（正位置）");
    expect(button(0).getAttribute("aria-expanded")).toBe("false");
    expect(button(2).getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the bubble with the Escape key", () => {
    revealAll(root);
    button(1).click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(bubble()).toBeNull();
    expect(button(1).getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the bubble open for keys other than Escape", () => {
    revealAll(root);
    button(1).click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(bubble()).not.toBeNull();
  });

  it("closes the bubble when clicking outside, but not when clicking inside it", () => {
    revealAll(root);
    button(1).click();
    bubble()!.click();
    expect(bubble()).not.toBeNull();
    document.body.click();
    expect(bubble()).toBeNull();
  });

  it("removes the bubble when a new reading is rendered", () => {
    revealAll(root);
    button(1).click();
    renderReading(root, reading);
    expect(bubble()).toBeNull();
  });

  describe("placement", () => {
    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

    /** root は (0, 0) から幅 rootWidth、カードは (cardLeft, cardTop) に 100×170 で置かれているとみなす */
    function layout(rootWidth: number, cardLeft: number, cardTop: number) {
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
        this: Element,
      ) {
        return this === root ? rect(0, 0, rootWidth, 800) : rect(cardLeft, cardTop, 100, 170);
      });
      vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
    }

    afterEach(() => vi.restoreAllMocks());

    it("puts the bubble below a card in the upper half, pointing at it", () => {
      layout(1000, 400, 100);
      revealAll(root);
      button(0).click();
      expect(bubble()?.classList.contains("above")).toBe(false);
      expect(bubble()?.style.left).toBe("450px");
      expect(bubble()?.style.top).toBe(`${270 + 12}px`);
      expect(bubble()?.style.getPropertyValue("--arrow-offset")).toBe("0px");
    });

    it("puts the bubble above a card in the lower half", () => {
      layout(1000, 400, 500);
      revealAll(root);
      button(0).click();
      expect(bubble()?.classList.contains("above")).toBe(true);
      expect(bubble()?.style.top).toBe(`${500 - 12}px`);
    });

    it("keeps the bubble inside the spread, shifting the arrow instead", () => {
      layout(1000, 0, 100);
      revealAll(root);
      button(0).click();
      expect(bubble()?.style.left).toBe("150px");
      expect(bubble()?.style.getPropertyValue("--arrow-offset")).toBe("-100px");
    });

    it("centres the bubble when the spread is narrower than the bubble", () => {
      layout(200, 50, 100);
      revealAll(root);
      button(0).click();
      expect(bubble()?.style.left).toBe("100px");
    });
  });
});
