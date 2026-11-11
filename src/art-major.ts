/**
 * 大アルカナ 22 枚の絵 (オリジナル)。それぞれの札の象徴を図形で表す。
 * 座標は viewBox 0 0 100 100。クラスの意味は art.ts を参照。
 */
import { arcPoints, rays, starPoints } from "./art-geometry";

/** 無限大の記号 (∞)。中心 (cx, cy)、片側の幅 w。 */
const lemniscate = (cx: number, cy: number, w: number, h: number) =>
  `<path class="accent" d="M${cx} ${cy} C${cx + w * 0.35} ${cy - h} ${cx + w} ${cy - h} ${cx + w} ${cy} ` +
  `C${cx + w} ${cy + h} ${cx + w * 0.35} ${cy + h} ${cx} ${cy} ` +
  `C${cx - w * 0.35} ${cy - h} ${cx - w} ${cy - h} ${cx - w} ${cy} ` +
  `C${cx - w} ${cy + h} ${cx - w * 0.35} ${cy + h} ${cx} ${cy}Z"/>`;

const dot = (x: number, y: number, r = 1.6, cls = "solid") =>
  `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;

const smallStar = (x: number, y: number, R: number, cls = "solid accent") =>
  `<polygon class="${cls}" points="${starPoints(x, y, R, R * 0.42, 4)}"/>`;

const rose = (x: number, y: number, r: number) =>
  `<g class="accent">` +
  [0, 72, 144, 216, 288]
    .map((deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return `<circle class="fill" cx="${(x + r * 0.55 * Math.cos(a)).toFixed(1)}" cy="${(y + r * 0.55 * Math.sin(a)).toFixed(1)}" r="${(r * 0.5).toFixed(1)}"/>`;
    })
    .join("") +
  dot(x, y, r * 0.3) +
  `</g>`;

const cup = (x: number, y: number, s: number, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" stroke-width="${(2.2 / s).toFixed(2)}">` +
  `<path class="fill" d="M-7 -9 H7 Q7 1 0 2.5 Q-7 1 -7 -9Z"/><path d="M0 2.5 V7"/>` +
  `<ellipse class="fill" cx="0" cy="8.5" rx="5" ry="1.6"/></g>`;

const crown = (x: number, y: number, s: number, rot = 0) =>
  `<g class="accent" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" stroke-width="${(2.2 / s).toFixed(2)}">` +
  `<path class="fill" d="M-9 7 H9 V-3 L5 1.5 L0 -7 L-5 1.5 L-9 -3Z"/></g>`;

export const MAJOR_ART: string[] = [
  // 0 愚者: 昇る太陽、崖の縁、杖に結んだ荷物、白い薔薇
  `<circle class="fill accent" cx="74" cy="22" r="9"/>` +
    `<path class="accent" d="${rays(74, 22, 12, 17, 8)}"/>` +
    `<path d="M8 88 H56 L68 74"/>` +
    `<path d="M26 82 L54 40"/>` +
    `<circle class="fill" cx="57" cy="36" r="6.5"/>` +
    rose(28, 62, 7),

  // 1 魔術師: 頭上の ∞、掲げた杖、机
  lemniscate(50, 18, 14, 7) +
    `<path d="M50 34 V70"/>` +
    dot(50, 34, 2.6) +
    dot(50, 70, 2.6) +
    `<path d="M16 82 H84 M22 82 V94 M78 82 V94"/>` +
    cup(30, 74, 0.55) +
    `<polygon class="fill" points="${starPoints(70, 75, 5, 2, 5)}"/>`,

  // 2 女教皇: 黒と白の 2 本の柱、その間の三日月
  `<rect class="solid" x="16" y="18" width="12" height="70" rx="1"/>` +
    `<rect x="72" y="18" width="12" height="70" rx="1"/>` +
    `<path d="M12 18 H32 M68 18 H88 M12 88 H32 M68 88 H88"/>` +
    `<path class="solid accent" d="M50 36 a16 16 0 1 0 0 32 a21 21 0 0 1 0 -32Z"/>`,

  // 3 女帝: 金星の記号と 12 の星の冠
  `<circle class="fill" cx="50" cy="46" r="14"/>` +
    `<path d="M50 60 V88 M39 75 H61"/>` +
    arcPoints(50, 46, 30, 12, 200, 340)
      .map(([x, y]) => smallStar(x, y, 3))
      .join(""),

  // 4 皇帝: 雄羊の角の玉座とアンク
  `<rect class="fill" x="26" y="40" width="48" height="48" rx="2"/>` +
    `<path d="M26 40 c-11 -2 -13 -15 -4 -17 c6 -1 8 6 3 8"/>` +
    `<path d="M74 40 c11 -2 13 -15 4 -17 c-6 -1 -8 6 -3 8"/>` +
    `<g class="accent"><ellipse cx="50" cy="52" rx="5" ry="6"/><path d="M50 58 V80 M41 64 H59"/></g>`,

  // 5 教皇: 三重冠と交差した 2 本の鍵
  `<path class="fill accent" d="M35 52 H65 L62 42 H38Z M38 42 H62 L59 32 H41Z M41 32 H59 L55 22 H45Z"/>` +
    `<path class="accent" d="M50 22 V11 M45 15 H55"/>` +
    `<path d="M30 90 L56 64 M70 90 L44 64"/>` +
    `<circle cx="28" cy="92" r="4"/><circle cx="72" cy="92" r="4"/>` +
    `<path d="M52 68 L56 72 M48 68 L44 72"/>`,

  // 6 恋人: 天の太陽と向かい合う 2 人、間にハート
  `<circle class="fill accent" cx="50" cy="20" r="8"/>` +
    `<path class="accent" d="${rays(50, 20, 11, 15, 12)}"/>` +
    `<circle class="fill" cx="28" cy="52" r="6.5"/><path class="fill" d="M28 59 L17 90 H39Z"/>` +
    `<circle class="fill" cx="72" cy="52" r="6.5"/><path class="fill" d="M72 59 L61 90 H83Z"/>` +
    `<path class="solid accent" d="M50 78 C42 71 42 63 50 67 C58 63 58 71 50 78Z"/>`,

  // 7 戦車: 星の天蓋、車体、2 つの車輪
  `<path d="M20 34 Q50 20 80 34"/>` +
    smallStar(35, 29, 3) +
    smallStar(50, 26, 3) +
    smallStar(65, 29, 3) +
    `<path d="M26 34 V44 M74 34 V44"/>` +
    `<rect class="fill" x="24" y="44" width="52" height="26" rx="2"/>` +
    `<polygon class="solid accent" points="${starPoints(50, 57, 7, 3, 8)}"/>` +
    `<circle cx="32" cy="80" r="9"/><path d="${rays(32, 80, 0, 9, 6)}"/>` +
    `<circle cx="68" cy="80" r="9"/><path d="${rays(68, 80, 0, 9, 6)}"/>`,

  // 8 力: 頭上の ∞ と獅子
  lemniscate(50, 16, 11, 5.5) +
    `<path class="accent" d="${rays(50, 60, 18, 27, 16)}"/>` +
    `<circle class="fill" cx="50" cy="60" r="16"/>` +
    dot(44, 56, 1.8) +
    dot(56, 56, 1.8) +
    `<path d="M46 66 Q50 70 54 66 M50 62 V66"/>`,

  // 9 隠者: 杖と、六芒星を灯したランタン、山
  `<path d="M28 12 V86"/>` +
    `<path d="M62 22 V32"/>` +
    `<path class="fill" d="M54 32 H70 L68 36 H56Z"/>` +
    `<rect class="fill" x="53" y="36" width="18" height="24" rx="3"/>` +
    `<polygon class="solid accent" points="${starPoints(62, 48, 7, 4, 6)}"/>` +
    `<path d="M8 92 L36 72 L56 84 L92 64"/>`,

  // 10 運命の輪: 二重の輪と 8 本の輻
  `<circle cx="50" cy="50" r="36"/>` +
    `<circle class="fill" cx="50" cy="50" r="24"/>` +
    `<path d="${rays(50, 50, 7, 36, 8, 22.5)}"/>` +
    `<circle class="solid accent" cx="50" cy="50" r="6"/>` +
    [0, 90, 180, 270]
      .map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return dot(+(50 + 30 * Math.cos(a)).toFixed(1), +(50 + 30 * Math.sin(a)).toFixed(1), 2.4, "solid accent");
      })
      .join(""),

  // 11 正義: 立てた剣と天秤
  `<path class="fill" d="M50 10 L54 18 V72 H46 V18Z"/>` +
    `<path d="M40 72 H60 M50 72 V84"/>` +
    dot(50, 87, 2.4) +
    `<g class="accent"><path d="M18 34 H82 M22 34 L14 58 M22 34 L30 58 M78 34 L70 58 M78 34 L86 58"/>` +
    `<path class="fill" d="M12 58 Q22 70 32 58Z"/><path class="fill" d="M68 58 Q78 70 88 58Z"/></g>`,

  // 12 吊るされた男: T 字の木から逆さに吊られ、頭に光輪
  `<path d="M18 14 H82 M24 14 V8 M76 14 V8"/>` +
    `<path d="M50 14 V24"/>` +
    `<path d="M50 24 V48 M50 32 L61 42 L50 46"/>` +
    `<path class="fill" d="M50 48 L40 60 L50 66 L60 60Z"/>` +
    `<circle class="accent" cx="50" cy="78" r="12"/>` +
    `<circle class="fill" cx="50" cy="78" r="7"/>`,

  // 13 死神: 白い薔薇の旗、二つの塔の間に沈む太陽
  `<path d="M26 10 V92"/>` +
    `<path class="fill" d="M26 14 H76 L67 28 L76 42 H26Z"/>` +
    rose(48, 28, 8) +
    `<rect class="fill" x="50" y="64" width="9" height="24"/>` +
    `<rect class="fill" x="81" y="64" width="9" height="24"/>` +
    `<path class="fill accent" d="M60 88 a10 10 0 0 1 20 0Z"/>` +
    `<path d="M44 88 H96"/>`,

  // 14 節制: 2 つの杯の間を流れる水、胸の三角と四角
  cup(30, 30, 1.25, -35) +
    cup(70, 60, 1.25, 20) +
    `<path class="accent" d="M37 26 Q58 26 65 48" stroke-dasharray="3 3"/>` +
    `<rect x="40" y="76" width="20" height="16"/>` +
    `<path class="solid accent" d="M50 79 L57 90 H43Z"/>`,

  // 15 悪魔: 逆さの五芒星と鎖
  `<circle class="fill" cx="50" cy="36" r="22"/>` +
    `<polygon class="accent" points="${starPoints(50, 36, 19, 7.5, 5, 180)}"/>` +
    `<path d="M50 58 V64 M38 64 H62"/>` +
    `<ellipse cx="34" cy="74" rx="5" ry="7"/><ellipse cx="66" cy="74" rx="5" ry="7"/>` +
    `<path d="M38 64 L34 67 M62 64 L66 67"/>` +
    `<rect class="fill" x="22" y="84" width="56" height="8" rx="1"/>`,

  // 16 塔: 雷に打たれ、王冠が吹き飛ぶ塔
  `<path class="fill" d="M36 92 V38 H64 V92"/>` +
    `<path d="M34 38 H66 M36 38 V32 H42 V38 M47 38 V32 H53 V38 M58 38 V32 H64 V38"/>` +
    `<rect x="46" y="52" width="8" height="12" rx="4"/>` +
    `<rect x="46" y="72" width="8" height="12" rx="4"/>` +
    crown(30, 20, 0.9, -28) +
    `<path class="solid accent" d="M86 4 L70 26 H78 L62 48 L68 30 H60Z"/>` +
    dot(24, 44, 1.6, "solid accent") +
    dot(76, 56, 1.6, "solid accent"),

  // 17 星: 大きな八芒星と 7 つの小さな星、水面
  `<polygon class="solid accent" points="${starPoints(50, 36, 22, 8, 8)}"/>` +
    [[18, 16], [82, 16], [14, 44], [86, 44], [24, 68], [76, 68], [50, 72]]
      .map(([x, y]) => `<polygon class="fill accent" points="${starPoints(x, y, 5.5, 2, 8)}"/>`)
      .join("") +
    `<path d="M8 88 q10 -6 21 0 t21 0 t21 0 t21 0"/>`,

  // 18 月: 満ちていく月、2 つの塔、曲がりくねった道
  `<circle class="fill" cx="50" cy="32" r="20"/>` +
    `<path class="solid accent" d="M50 12 a20 20 0 1 0 0 40 a26 26 0 0 1 0 -40Z"/>` +
    `<rect class="fill" x="10" y="60" width="12" height="30"/><path d="M8 60 L16 50 L24 60"/>` +
    `<rect class="fill" x="78" y="60" width="12" height="30"/><path d="M76 60 L84 50 L92 60"/>` +
    `<path d="M50 94 Q38 84 50 76 Q62 68 50 60"/>` +
    [[36, 58], [64, 58], [50, 66]]
      .map(([x, y]) => `<path class="solid accent" d="M${x} ${y - 4} Q${x + 3} ${y} ${x} ${y + 2} Q${x - 3} ${y} ${x} ${y - 4}Z"/>`)
      .join(""),

  // 19 太陽: 輝く太陽、塀とひまわり
  `<circle class="fill accent" cx="50" cy="40" r="16"/>` +
    `<path class="accent" d="${rays(50, 40, 20, 30, 8)}"/>` +
    `<path class="accent" d="${rays(50, 40, 20, 25, 8, 22.5)}"/>` +
    `<path d="M10 86 H90 M10 78 H90"/>` +
    [24, 50, 76]
      .map((x) => `<circle class="solid accent" cx="${x}" cy="72" r="3"/><path d="${rays(x, 72, 4, 7, 8)}"/>`)
      .join(""),

  // 20 審判: 雲間からのラッパと十字の旗、目覚める人々
  `<path class="fill" d="M8 24 q4 -10 13 -6 q5 -9 14 -2 q8 -4 10 5Z"/>` +
    `<path d="M30 22 L62 42"/>` +
    `<path class="fill accent" d="M58 38 L74 30 L76 50Z"/>` +
    `<rect class="fill" x="38" y="30" width="12" height="10" transform="rotate(32 44 35)"/>` +
    `<path d="M44 31 V39 M40 35 H48" transform="rotate(32 44 35)"/>` +
    `<rect class="fill" x="16" y="74" width="68" height="14" rx="1"/>` +
    `<circle cx="34" cy="66" r="4.5"/><circle cx="50" cy="62" r="4.5"/><circle cx="66" cy="66" r="4.5"/>` +
    `<path d="M50 67 V74 M43 69 L50 72 L57 69"/>`,

  // 21 世界: 月桂樹の輪の中で踊る人、四隅の 4 つの生き物
  `<ellipse cx="50" cy="52" rx="22" ry="33"/>` +
    // 輪に沿って葉を 16 枚
    `<path class="accent" d="${Array.from({ length: 16 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 16;
      const x = 50 + 22 * Math.cos(a);
      const y = 52 + 33 * Math.sin(a);
      return `M${x.toFixed(1)} ${y.toFixed(1)} l${(4 * Math.cos(a + 0.9)).toFixed(1)} ${(4 * Math.sin(a + 0.9)).toFixed(1)}`;
    }).join("")}"/>` +
    `<path class="solid accent" d="M44 18 L56 22 L44 22 L56 18Z M44 82 L56 86 L44 86 L56 82Z"/>` +
    `<circle class="fill" cx="50" cy="38" r="4.5"/>` +
    `<path d="M50 43 V60 M50 60 L44 72 M50 60 L56 70 L52 74 M50 48 L40 44 M50 48 L60 52"/>` +
    [[12, 12], [88, 12], [12, 92], [88, 92]].map(([x, y]) => dot(x, y, 5, "fill")).join(""),
];
