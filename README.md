# ArcanaDesk

[![CI](https://github.com/Toshiaki0315/ArcanaDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Toshiaki0315/ArcanaDesk/actions/workflows/ci.yml)

ローカルファーストで動作するデスクトップ向けタロット占いアプリケーションです。
Tauri v2, Rust, TypeScriptを用いて開発されています。

- リポジトリ: https://github.com/Toshiaki0315/ArcanaDesk.git

## 前提条件
- macOS (Apple Silicon M4)
- Node.js / pnpm
- Rust (cargo)
- Tauri CLI v2

## 開発開始手順
1. リポジトリのクローン: `git clone https://github.com/Toshiaki0315/ArcanaDesk.git`
2. 依存関係インストール: `pnpm install` (下の `make` コマンドを使う場合は自動で行われます)
3. Tauri開発サーバー起動: `make dev` (または `pnpm tauri dev`)
4. (任意) カードのドット絵を用意: `make cards` (下の「カードの絵」を参照)

## make コマンド
| コマンド | 内容 | できるもの |
|---|---|---|
| `make dev` | 開発モードで起動 (コードを変えると自動で反映) | — |
| `make app` | リリース版のアプリを作る | `src-tauri/target/release/bundle/macos/ArcanaDesk.app` |
| `make dmg` | 配布用のディスクイメージを作る (.app も一緒に作る) | `src-tauri/target/release/bundle/dmg/ArcanaDesk_<版>_aarch64.dmg` |
| `make cards` | カードのドット絵を用意する (任意) | `public/cards/00.png`〜`77.png` |

- `make` だけを実行すると、コマンドの一覧が表示されます。
- 依存パッケージが未インストール、または `package.json` / `pnpm-lock.yaml` より古い場合は、先に `pnpm install` を実行します。
- `make dev` / `make app` / `make dmg` は、`public/cards/` にドット絵があればそれを使い、無ければ簡易版の SVG の絵でビルドします。どちらを使うかは実行時に表示されます。
- 署名・公証はしていないので、作った .app / .dmg を別の Mac で開くと警告が出ます。

## テスト
```bash
cd src-tauri
cargo test --lib               # Rust ユニットテスト
cargo llvm-cov --lib --summary-only   # カバレッジ (cargo-llvm-cov)
cd ..
pnpm test                      # TypeScript ユニットテスト (vitest)
pnpm coverage                  # TypeScript カバレッジ
```

## CI
GitHub Actions (`.github/workflows/ci.yml`) が main への push と PR ごとに以下を実行します。

- フロントエンド: 型チェック・ビルド、vitest (カバレッジ 90% 未満で失敗)
- Rust: `cargo fmt --check`、`cargo clippy -D warnings`、テスト (行カバレッジ 90% 未満で失敗)

## 構成
- `src-tauri/src/tarot.rs` — `Card` / `Deck` (78枚生成・シャッフル・ドロー・正逆判定)
- `src-tauri/src/spread.rs` — スプレッド (ワンオラクル / スリーカード / ケルト十字) の展開
- `src-tauri/src/commands.rs` — Tauri コマンド `draw_reading` / `list_history` / `delete_history` / `clear_history` (モック IPC テスト付き)
- `src-tauri/src/history.rs` — 占い履歴の JSON 保存 (一時ファイル経由の書き込み、壊れたファイルは上書きしない)
- `src/api.ts` — Rust と共通の型定義と `drawReading()` (invoke ラッパー)
- `src/card.ts` — カード表面の番号 (ローマ数字 / ランク)
- `src/art.ts` / `src/art-major.ts` — 簡易版のカードの絵 (オリジナルの SVG。ドット絵が無いときに表示)
- `src/card-image.ts` — カードのドット絵の URL (`public/cards/NN.png`、NN はカード id)
- `src/meanings.ts` — 78枚の日本語名と正位置・逆位置の意味 (カード id で引く)
- `src/render.ts` — カードと凡例の描画 (裏向きで配り、クリック / すべてめくるで表に返す)
- `src/bubble.ts` — 表向きのカードをクリックしたときの解説の吹き出し
- `src/positions.ts` — スプレッドの各位置が表すものの説明
- `src/styles.css` — カードデザインとスプレッド配置 (ケルト十字は CSS Grid で十字 + 杖に配置)
- `src/history.ts` — 履歴一覧の描画、日時の整形、二度押し確認ボタン
- `src/main.ts` — 画面の初期化とイベント処理
- `scripts/fetch-cards.py` / `scripts/pixelate-cards.py` — カードの原画の取得とドット絵への変換 (取得元は `scripts/rws-sources.json`)

## データの保存場所
占い履歴は占うたびに自動保存されます。

- macOS: `~/Library/Application Support/com.toshiaki.arcanadesk/history.json`

## カードの絵
カードの絵は 2 種類あります。

- **簡易版 (標準):** オリジナルの SVG の絵です (`src/art.ts`)。コードに含まれているので、何も用意しなくても表示されます。
- **ドット絵 (任意):** ライダー・ウェイト・スミス版タロット (1909 年、絵: Pamela Colman Smith、パブリックドメイン) をドット絵にしたものです。`public/cards/00.png`〜`77.png` に置くと、簡易版の代わりに表示されます。

ドット絵はリポジトリに含めていないので、使う場合は手元で用意します。

1. Pillow をインストールします (まだの場合)。
   ```bash
   python3 -m pip install Pillow
   ```
2. 原画 78 枚 (約 66MB) を Wikimedia Commons から取得し、ドット絵に変換します。原画は `.cards-src/` (git 管理外) に保存され、2 回目以降は再利用されます。
   ```bash
   make cards
   ```
3. 以後の `make dev` / `make app` / `make dmg` では、ドット絵が使われます。

- 取得元: `scripts/rws-sources.json` (78 枚の Wikimedia Commons の URL)
- 取得: `scripts/fetch-cards.py` (1 枚ごとに間隔を空け、混雑時は待って再試行。途中で止まっても再実行で続きから)
- 変換: `scripts/pixelate-cards.py` (縁・番号・題名の帯を切り落とし、テーマに合わせて暗くしてから、幅 64 ドット・32 色に減色。明るさや色数はスクリプト冒頭の値で変えられます)
- テスト (`pnpm test`) はドット絵を使いません。画像の有無による表示の切り替えは、画像の読み込み成功・失敗を模して確かめています。
