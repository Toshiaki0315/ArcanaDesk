import { orientationLabel, type DrawnCard, type Reading } from "./api";
import { cardNumeral, suitSymbol } from "./card";

function el(tag: string, className: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/*
 * <div data-spread="…">                 ← container
 *   <ul class="reading-cards"> カード… </ul>
 *   <ol class="reading-legend"> 位置ごとの凡例… </ol>
 * </div>
 *
 * <li class="card [reversed] [flipped]" data-position="0">
 *   <span class="card-index">1</span>
 *   <span class="card-position">過去</span>
 *   <button class="card-inner">            ← 3D 回転する本体
 *     <div class="card-back">…</div>
 *     <div class="card-face">番号 / シンボル / 名前</div>
 *   </button>
 *   <span class="card-orientation">正位置</span>
 * </li>
 */
function renderCard(drawn: DrawnCard, index: number): HTMLElement {
  const { position_name, card } = drawn;
  const li = el("li", card.is_reversed ? "card reversed" : "card");
  li.dataset.cardId = String(card.id);
  li.dataset.suit = card.suit;
  li.dataset.position = String(drawn.position);
  li.style.setProperty("--deal-index", String(index));

  const back = el("div", "card-back");
  back.append(el("span", "card-back-emblem", "✶"));

  const face = el("div", "card-face");
  face.append(
    el("span", "card-numeral", cardNumeral(card)),
    el("span", "card-symbol", suitSymbol(card.suit)),
    el("span", "card-name", card.name),
  );

  const inner = el("button", "card-inner") as HTMLButtonElement;
  inner.type = "button";
  inner.setAttribute("aria-label", `${position_name}のカードをめくる`);
  inner.append(back, face);
  inner.addEventListener("click", () => revealCard(li));

  li.append(
    el("span", "card-index", String(drawn.position + 1)),
    el("span", "card-position", position_name),
    inner,
    el("span", "card-orientation", orientationLabel(card)),
  );
  return li;
}

function renderLegendItem({ position, position_name }: DrawnCard): HTMLElement {
  const li = el("li", "legend-item");
  li.dataset.position = String(position);
  li.append(
    el("span", "legend-index", String(position + 1)),
    el("span", "legend-position", position_name),
    el("span", "legend-card", "？"),
  );
  return li;
}

/** 展開結果を裏向きでコンテナに描画する (前回の結果は置き換える)。 */
export function renderReading(container: HTMLElement, reading: Reading): void {
  container.dataset.spread = reading.spread;
  const cards = el("ul", "reading-cards");
  cards.append(...reading.cards.map(renderCard));
  const legend = el("ol", "reading-legend");
  legend.append(...reading.cards.map(renderLegendItem));
  container.replaceChildren(cards, legend);
}

/** カードを表向きにする (一方向。再度呼んでも裏には戻らない)。 */
export function revealCard(cardEl: HTMLElement): void {
  if (cardEl.classList.contains("flipped")) return;
  cardEl.classList.add("flipped");
  const position = cardEl.querySelector(".card-position")?.textContent;
  const name = cardEl.querySelector(".card-name")?.textContent;
  const orientation = cardEl.querySelector(".card-orientation")?.textContent;
  cardEl
    .querySelector(".card-inner")
    ?.setAttribute("aria-label", `${position}: ${name}（${orientation}）`);

  const legendItem = cardEl
    .closest("[data-spread]")
    ?.querySelector(`.reading-legend > [data-position="${cardEl.dataset.position}"]`);
  if (legendItem) {
    legendItem.classList.add("revealed");
    legendItem.querySelector(".legend-card")!.textContent = `${name}（${orientation}）`;
  }
}

export function revealAll(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>(".card").forEach(revealCard);
}
