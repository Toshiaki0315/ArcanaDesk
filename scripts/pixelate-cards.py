"""
ライダー・ウェイト・スミス版 (1909 年、パブリックドメイン) の原画を
ドット絵に変換して public/cards/NN.png (NN = カード id) に書き出す。

使い方:
    python3 -I scripts/pixelate-cards.py <原画フォルダ> public/cards

原画は scripts/rws-sources.json の URL (Wikimedia Commons) から取得したもの。
原画そのものはリポジトリに入れない。

処理:
  1. 黒い外枠の線を検出し、その内側だけを残す
  2. 題名の帯 (THE FOOL など) がある札 (大アルカナ・エース・人物札) は、帯の上の線で切る。
     線が印刷されていない札 (カップのナイトなど) は、標準的な位置 (87.5%) で切る
  3. 上部のローマ数字を含む帯を切り落とす
  4. 黒基調のテーマになじむよう、明るさと彩度を落とし、紫を薄く重ねる
  5. 幅 64 ドットに縮小し、32 色に減色する (見本 C の設定)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageEnhance

WIDTH = 64
COLORS = 32
DARK = 90  # これより暗い画素を「線」とみなす
TOP_EXTRA = 0.035  # 外枠の内側からさらに切る割合 (ローマ数字の帯。これ以上切ると頭が欠ける札がある)
MARGIN = 0.006
TITLE_FALLBACK = 0.875  # 題名の帯の線が見つからないときに切る位置

# テーマになじませる色合い (1.0 で原画のまま)
BRIGHTNESS = 0.78
SATURATION = 0.72
TINT = (40, 28, 80)  # テーマの紫 (--back-bg 付近)
TINT_AMOUNT = 0.14


def has_title(card_id: int) -> bool:
    """題名の帯がある札か。大アルカナ (0〜21) と、各スートのエース・人物札。"""
    if card_id < 22:
        return True
    rank = (card_id - 22) % 14  # 0 = エース … 10〜13 = ペイジ〜キング
    return rank == 0 or rank >= 10


def line_groups(px, length, span, horizontal):
    """縦 (または横) 方向に、全体の 60% 以上が暗い行 (列) のまとまりを返す。"""
    found = []
    for i in range(length):
        dark = sum(
            1 for j in range(0, span, 4) if (px[j, i] if horizontal else px[i, j]) < DARK
        )
        if dark > (span // 4) * 0.6:
            if found and i - found[-1][1] <= 3:
                found[-1][1] = i
            else:
                found.append([i, i])
    return found


def crop_box(img, titled: bool):
    gray = img.convert("L")
    px, w, h = gray.load(), gray.width, gray.height
    rows = line_groups(px, h, w, horizontal=True)
    cols = line_groups(px, w, h, horizontal=False)

    left = max((b for a, b in cols if a < 0.1 * w), default=round(0.05 * w))
    right = min((a for a, b in cols if a > 0.9 * w), default=round(0.95 * w))
    top = max((b for a, b in rows if a < 0.06 * h), default=round(0.03 * h))
    bottom = min((a for a, b in rows if a > 0.92 * h), default=round(0.95 * h))
    if titled:
        # 題名の帯: 外枠の少し上にある横線。無ければ標準の位置で切る
        title = [a for a, b in rows if 0.84 * h <= a <= 0.905 * h]
        bottom = max(title) if title else round(TITLE_FALLBACK * h)

    m = round(MARGIN * h)
    top += round(TOP_EXTRA * h)
    return (left + m, top + m, right - m, bottom - m)


def tone(img):
    """黒基調のテーマになじむよう、暗く・落ち着いた色にし、紫を薄く重ねる。"""
    img = ImageEnhance.Contrast(img).enhance(1.15)
    img = ImageEnhance.Color(img).enhance(SATURATION)
    img = ImageEnhance.Brightness(img).enhance(BRIGHTNESS)
    return Image.blend(img, Image.new("RGB", img.size, TINT), TINT_AMOUNT)


def pixelate(img):
    img = tone(img)
    height = round(img.height * WIDTH / img.width)
    small = img.resize((WIDTH, height), Image.Resampling.BOX)
    return small.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def main(src_dir: Path, out_dir: Path) -> None:
    sources = json.loads((Path(__file__).parent / "rws-sources.json").read_text())
    out_dir.mkdir(parents=True, exist_ok=True)
    for entry in sources:
        img = Image.open(src_dir / entry["file"]).convert("RGB")
        art = img.crop(crop_box(img, has_title(entry["id"])))
        pixelate(art).save(out_dir / f"{entry['id']:02d}.png", optimize=True)
    print(f"converted {len(sources)} cards into {out_dir}")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
