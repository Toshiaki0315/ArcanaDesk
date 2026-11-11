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
2. 依存関係インストール: `pnpm install`
3. Tauri開発サーバー起動: `pnpm tauri dev`

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
- `src/card.ts` — カード表面の番号 (ローマ数字 / ランク) とスートシンボル
- `src/meanings.ts` — 78枚の日本語名と正位置・逆位置の意味 (カード id で引く)
- `src/render.ts` — カードと凡例の描画 (裏向きで配り、クリック / すべてめくるで表に返す)
- `src/styles.css` — カードデザインとスプレッド配置 (ケルト十字は CSS Grid で十字 + 杖に配置)
- `src/history.ts` — 履歴一覧の描画、日時の整形、二度押し確認ボタン
- `src/main.ts` — 画面の初期化とイベント処理

## データの保存場所
占い履歴は占うたびに自動保存されます。

- macOS: `~/Library/Application Support/com.toshiaki.arcanadesk/history.json`
