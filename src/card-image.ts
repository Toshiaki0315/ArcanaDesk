/**
 * カードのドット絵。
 *
 * 画像はリポジトリにもアプリにも含めず、使う人がアプリのデータフォルダの
 * cards/NN.png に置く (make cards で用意できる)。アプリは起動時に Rust の
 * card_images コマンドで 1 回だけ読み込み、ここに覚えておく。
 * そのため画像を入れ替えたら、アプリを起動し直すだけで反映される (ビルド不要)。
 */
import type { Card } from "./api";

let images: (string | null)[] = [];

/** カードのドット絵の data URL を返す (起動時に受け取った画像。無ければ null)。 */
export function cardImageUrl(card: Card): string | null {
  return images[card.id] ?? null;
}

/** 起動時に Rust から受け取った 78 枚分の画像 (無い札は null) を覚えておく。 */
export function setCardImages(list: (string | null)[]): void {
  images = list;
}
