/** 絵を描くための図形の座標計算。 */

const rad = (deg: number) => (deg * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);

/** n 角の星の頂点 (外径 R, 内径 r)。rot は度、0 で頂点が上を向く。 */
export function starPoints(cx: number, cy: number, R: number, r: number, n = 5, rot = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const radius = i % 2 === 0 ? R : r;
    const a = rad(rot + (i * 180) / n - 90);
    pts.push(`${f(cx + radius * Math.cos(a))},${f(cy + radius * Math.sin(a))}`);
  }
  return pts.join(" ");
}

/** 中心から放射状に伸びる n 本の線 (半径 r1 から r2 まで) の path データ。 */
export function rays(cx: number, cy: number, r1: number, r2: number, n: number, rot = 0): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = rad(rot + (i * 360) / n);
    d +=
      `M${f(cx + r1 * Math.cos(a))} ${f(cy + r1 * Math.sin(a))}` +
      `L${f(cx + r2 * Math.cos(a))} ${f(cy + r2 * Math.sin(a))}`;
  }
  return d;
}

/** 円周上 (角度 from〜to 度、0 が右、時計回り) に等間隔に置いた n 個の点。 */
export function arcPoints(
  cx: number,
  cy: number,
  r: number,
  n: number,
  from: number,
  to: number,
): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = rad(from + ((to - from) * i) / Math.max(n - 1, 1));
    return [Number(f(cx + r * Math.cos(a))), Number(f(cy + r * Math.sin(a)))];
  });
}
