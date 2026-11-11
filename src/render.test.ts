import { beforeEach, describe, expect, it } from "vitest";
import { renderReading, revealAll, revealCard } from "./render";
import type { Reading } from "./api";
import { cardMeaning } from "./meanings";

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

  it("shows numeral and suit symbol on the face", () => {
    renderReading(container, reading);
    const second = container.querySelectorAll(".card")[1];
    expect(second.querySelector(".card-numeral")?.textContent).toBe("A");
    expect(second.querySelector(".card-symbol")?.textContent).toBe("♥");
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

describe("legend", () => {
  beforeEach(() => renderReading(container, reading));

  const items = () => [...container.querySelectorAll<HTMLElement>(".reading-legend > li")];

  it("lists every position in order", () => {
    expect(items().map((li) => li.querySelector(".legend-position")?.textContent)).toEqual([
      "過去",
      "現在",
      "未来",
    ]);
    expect(items().map((li) => li.querySelector(".legend-index")?.textContent)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("hides card names and meanings until revealed", () => {
    expect(items().map((li) => li.querySelector(".legend-card")?.textContent)).toEqual([
      "？",
      "？",
      "？",
    ]);
    expect(items().map((li) => li.querySelector(".legend-meaning")?.textContent)).toEqual([
      "",
      "",
      "",
    ]);
  });

  it("fills in the matching legend entry when a card is revealed", () => {
    revealCard(container.querySelectorAll<HTMLElement>(".card")[1]);
    const [first, second] = items();
    expect(first.querySelector(".legend-card")?.textContent).toBe("？");
    expect(second.querySelector(".legend-card")?.textContent).toBe("カップのエース（逆位置）");
    expect(second.querySelector(".legend-meaning")?.textContent).toBe(
      cardMeaning(reading.cards[1].card).reversed,
    );
    expect(second.classList.contains("revealed")).toBe(true);
  });

  it("revealAll fills in the whole legend", () => {
    revealAll(container);
    expect(items()).toHaveLength(3);
    expect(items().every((li) => li.classList.contains("revealed"))).toBe(true);
  });

  it("revealing a detached card does not throw", () => {
    const card = container.querySelector<HTMLElement>(".card")!;
    card.remove();
    expect(() => revealCard(card)).not.toThrow();
    expect(card.classList.contains("flipped")).toBe(true);
  });
});

