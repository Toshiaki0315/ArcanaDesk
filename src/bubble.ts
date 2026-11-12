/**
 * 表向きのカードをクリックしたときに出す解説の吹き出し。
 *
 * 吹き出しはカードの中ではなく展開全体 (root) に 1 つだけ置く。
 * カードの中に置くと、横向きの「障害」や逆位置のカードと一緒に回転してしまうため。
 */
import { orientationLabel, type DrawnCard } from "./api";
import { cardMeaning, cardNameJa } from "./meanings";
import { positionDescription } from "./positions";
import type { SpreadType } from "./api";

const drawnByCard = new WeakMap<HTMLElement, DrawnCard>();
const wiredRoots = new WeakSet<HTMLElement>();

function el(tag: string, className: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** 吹き出しに必要なカードの情報を、カードの要素に結び付けておく。 */
export function attachCard(cardEl: HTMLElement, drawn: DrawnCard): void {
  drawnByCard.set(cardEl, drawn);
}

export function closeBubble(root: HTMLElement): void {
  root.querySelector(".card-bubble")?.remove();
  root
    .querySelectorAll(".card-inner[aria-expanded='true']")
    .forEach((b) => b.setAttribute("aria-expanded", "false"));
}

/** 同じカードなら閉じ、別のカードならそのカードの吹き出しに切り替える。 */
export function toggleBubble(root: HTMLElement, cardEl: HTMLElement): void {
  const button = cardEl.querySelector<HTMLElement>(".card-inner")!;
  const wasOpen = button.getAttribute("aria-expanded") === "true";
  closeBubble(root);
  if (wasOpen) return;

  const bubble = renderBubble(root.dataset.spread as SpreadType, drawnByCard.get(cardEl)!, cardEl);
  root.append(bubble);
  button.setAttribute("aria-expanded", "true");
  place(root, button, bubble);
}

/**
 * 吹き出しに載せるカードの絵。展開にあるカードの表面 (簡易版の SVG と、読み込めていればドット絵) を
 * そのまま複製して、どのカードの説明かがひと目で分かるようにする。説明は文字で書いてあるので装飾扱い。
 */
function renderPicture(cardEl: HTMLElement, card: DrawnCard["card"]): HTMLElement {
  const picture = el("div", card.is_reversed ? "bubble-card reversed" : "bubble-card");
  picture.setAttribute("aria-hidden", "true");
  picture.dataset.suit = card.suit;
  picture.append(cardEl.querySelector(".card-face")!.cloneNode(true));
  return picture;
}

function renderBubble(
  spread: SpreadType,
  { position, position_name, card }: DrawnCard,
  cardEl: HTMLElement,
): HTMLElement {
  const name = cardNameJa(card);
  const meaning = cardMeaning(card);
  const bubble = el("div", "card-bubble");
  bubble.setAttribute("role", "dialog");
  bubble.setAttribute("aria-label", `${name}の解説`);
  // 見出し: どの位置のカードか (「近未来」) と、その位置が表すもの
  const heading = el("div", "bubble-heading");
  heading.append(
    el("p", "bubble-position-name", position_name),
    el("p", "bubble-position", positionDescription(spread, position)),
  );
  const text = el("div", "bubble-text");
  text.append(
    heading,
    el("p", "bubble-title", `${name}（${orientationLabel(card)}）`),
    el("p", "bubble-subtitle", card.name),
    el("p", "bubble-meaning", card.is_reversed ? meaning.reversed : meaning.upright),
    el(
      "p",
      "bubble-other",
      card.is_reversed ? `正位置では: ${meaning.upright}` : `逆位置では: ${meaning.reversed}`,
    ),
  );
  // 左に説明、右にカードの絵
  const body = el("div", "bubble-body");
  body.append(text, renderPicture(cardEl, card));
  bubble.append(body);
  return bubble;
}

/** 吹き出しの幅の半分 (CSS の .card-bubble の width: 430px と合わせる) */
const BUBBLE_HALF_WIDTH = 215;
const GAP = 12;

/**
 * カードの下 (画面の下半分にあるカードなら上) に、矢印をカードへ向けて置く。
 * 左右は展開の幅からはみ出さないように寄せる。
 */
function place(root: HTMLElement, button: HTMLElement, bubble: HTMLElement): void {
  const card = button.getBoundingClientRect();
  const box = root.getBoundingClientRect();
  const centerX = card.left + card.width / 2 - box.left;
  const x =
    box.width > BUBBLE_HALF_WIDTH * 2
      ? Math.min(Math.max(centerX, BUBBLE_HALF_WIDTH), box.width - BUBBLE_HALF_WIDTH)
      : box.width / 2;
  const above = card.top + card.height / 2 > window.innerHeight / 2;

  bubble.classList.toggle("above", above);
  bubble.style.left = `${x}px`;
  bubble.style.top = `${above ? card.top - box.top - GAP : card.bottom - box.top + GAP}px`;
  bubble.style.setProperty("--arrow-offset", `${centerX - x}px`);
}

/** Esc キーと、吹き出し・カード以外のクリックで閉じる (root ごとに 1 回だけ登録)。 */
export function wireBubble(root: HTMLElement): void {
  if (wiredRoots.has(root)) return;
  wiredRoots.add(root);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBubble(root);
  });
  document.addEventListener("click", (e) => {
    if ((e.target as Element).closest(".card-bubble, .card-inner")) return;
    closeBubble(root);
  });
}
