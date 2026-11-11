"""
カードの原画 (ライダー・ウェイト・スミス版 1909 年、パブリックドメイン) 78 枚を
Wikimedia Commons からダウンロードする。

使い方:
    python3 -I scripts/fetch-cards.py <保存先フォルダ>

- 取得元は scripts/rws-sources.json。合計約 66MB。
- すでに保存済みのファイルは飛ばすので、途中で止まっても再実行で続きから取得できる。
- サーバーに負担をかけないよう 1 枚ごとに間隔を空け、
  「アクセスが多すぎる」(HTTP 429) と言われたら指示された時間だけ待って再試行する。

ダウンロードしたら scripts/pixelate-cards.py でドット絵に変換する (README の「カードの絵」)。
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

USER_AGENT = "ArcanaDesk/0.1 (card image setup script)"
INTERVAL = 4  # 秒
MAX_RETRIES = 6


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(MAX_RETRIES):
        try:
            return urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == MAX_RETRIES - 1:
                raise
            wait = int(e.headers.get("Retry-After") or 30 * (attempt + 1))
            print(f"  混雑しているため {wait} 秒待ちます", flush=True)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def main(dest: Path) -> None:
    sources = json.loads((Path(__file__).parent / "rws-sources.json").read_text())
    dest.mkdir(parents=True, exist_ok=True)
    fetched = skipped = 0
    for entry in sources:
        out = dest / entry["file"]
        if out.exists() and out.stat().st_size > 0:
            skipped += 1
            continue
        print(f"[{entry['id'] + 1:2d}/78] {entry['file']}", flush=True)
        data = fetch(entry["url"])
        # 途中で止まっても壊れたファイルが残らないよう、書き終えてから名前を付ける
        tmp = out.with_suffix(".part")
        tmp.write_bytes(data)
        tmp.rename(out)
        fetched += 1
        time.sleep(INTERVAL)
    print(f"完了: {fetched} 枚を取得、{skipped} 枚は取得済み ({dest})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("使い方: python3 -I scripts/fetch-cards.py <保存先フォルダ>")
    main(Path(sys.argv[1]))
