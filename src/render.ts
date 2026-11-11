import { orientationLabel, type Card, type DrawnCard, type Reading } from "./api";
import { cardArt } from "./art";
import { attachCard, toggleBubble, wireBubble } from "./bubble";
import { cardImageUrl } from "./card-image";
import { cardNumeral } from "./card";
import { cardNameJa, currentMeaning } from "./meanings";

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
 *     <div class="card-face [has-image | no-image]">
 *       番号 / 簡易版の絵 (SVG) / ドット絵 (読み込めたら SVG の上に重なる) / 日本語名 / 英語名
 *     </div>
 *   </button>
 *   <span class="card-orientation">正位置</span>
 *   <span class="card-meaning">向きに応じた意味</span>
 * </li>
 */
/** 簡易版の絵。art.ts が返す固定の SVG なので innerHTML で入れてよい。 */
function renderArt(card: Card): HTMLElement {
  const wrapper = el("span", "card-art");
  wrapper.innerHTML = cardArt(card);
  return wrapper;
}

/** カードのドット絵。名前は文字で表示するので画像は装飾扱い (alt="")。 */
function renderImage(url: string): HTMLImageElement {
  const img = el("img", "card-image") as HTMLImageElement;
  img.src = url;
  img.alt = "";
  img.decoding = "async";
  return img;
}

/** 「カップの」「エース」のように「の」の後ろで区切り、まとまりごとに折り返せるようにする。 */
function renderNameJa(name: string): HTMLElement {
  const wrapper = el("span", "card-name-ja");
  const parts = name.split(/(?<=の)/);
  wrapper.append(...parts.map((part) => el("span", "name-part", part)));
  return wrapper;
}

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
  face.append(el("span", "card-numeral", cardNumeral(card)), renderArt(card));
  // ドット絵は各自で用意するもの (起動時に読み込み済み)。あれば SVG の上に重ね、
  // 無い・表示できない札は SVG の簡易版のままにする。
  const url = cardImageUrl(card);
  if (url) {
    const image = renderImage(url);
    image.addEventListener("load", () => face.classList.add("has-image"));
    image.addEventListener("error", () => {
      face.classList.add("no-image");
      image.remove();
    });
    face.append(image);
  } else {
    face.classList.add("no-image");
  }
  face.append(renderNameJa(cardNameJa(card)), el("span", "card-name", card.name));

  const inner = el("button", "card-inner") as HTMLButtonElement;
  inner.type = "button";
  inner.setAttribute("aria-label", `${position_name}のカードをめくる`);
  inner.append(back, face);
  // 裏向きならめくる。表向きなら解説の吹き出しを開閉する
  inner.addEventListener("click", () => {
    if (li.classList.contains("flipped")) {
      toggleBubble(li.closest<HTMLElement>("[data-spread]")!, li);
    } else {
      revealCard(li);
    }
  });
  attachCard(li, drawn);

  li.append(
    el("span", "card-index", String(drawn.position + 1)),
    el("span", "card-position", position_name),
    inner,
    el("span", "card-orientation", orientationLabel(card)),
    el("span", "card-meaning", currentMeaning(card)),
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
    el("span", "legend-meaning", ""),
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
  wireBubble(container);
}

/** カードを表向きにする (一方向。再度呼んでも裏には戻らない)。 */
export function revealCard(cardEl: HTMLElement): void {
  if (cardEl.classList.contains("flipped")) return;
  cardEl.classList.add("flipped");
  cardEl.querySelector(".card-inner")?.setAttribute("aria-expanded", "false");
  const position = cardEl.querySelector(".card-position")?.textContent;
  const name = cardEl.querySelector(".card-name-ja")?.textContent;
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
    legendItem.querySelector(".legend-meaning")!.textContent =
      cardEl.querySelector(".card-meaning")!.textContent;
  }
}

export function revealAll(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>(".card").forEach(revealCard);
}
