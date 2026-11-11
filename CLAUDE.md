# Claude Custom Instructions for ArcanaDesk

## 開発環境・コンテキスト
- ユーザー環境: Apple Silicon Mac (M4), Cursor / Claude Code 連携
- フレームワーク: Tauri v2 (Rust バックエンド + TypeScript フロントエンド)
- アーキテクチャ: ローカルファースト (SQLite or Local JSON への履歴保存)
- リポジトリ: https://github.com/Toshiaki0315/ArcanaDesk.git

## コーディング・テスト規約
- **TDD (テスト駆動開発) を厳守してください。**
- ユーザーはバックエンド (Rust) ロジックのユニットテストカバレッジ 90% 〜 100% を目標としています。
- 実装コードを書く前に、必ず失敗するテストコード (`#[test]`) を書き、それをパスするように実装を行ってください。
- TypeScript側も、複雑な状態管理やユーティリティ関数にはテストを記述してください。

## 開発フロー (Git / CI)
- `main` はブランチ保護されています。直接 push はできず、変更は必ず PR 経由で入れてください (管理者も同様)。
- 作業は `main` を最新にしてから作業ブランチを切って行います。
  - ブランチ名: `feature/…` (機能追加)、`fix/…` (不具合修正)、`docs/…` (ドキュメント)、`ci/…` (CI 設定)
- コミットメッセージと PR の本文は日本語で書きます。
- push する前に、CI と同じチェックを手元で実行して通ることを確認してください。
  ```bash
  pnpm build && pnpm coverage
  cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo llvm-cov --lib --summary-only --fail-under-lines 90
  ```
- PR は GitHub Actions の CI (`Frontend (TypeScript)` と `Backend (Rust)`) が両方通らないとマージできません。カバレッジが 90% を下回っても CI は失敗します。
- マージ方式はマージコミット (`--merge`) です。CI 通過後に自動でマージさせる場合は `gh pr merge <番号> --auto --merge` を使います。
- マージ後、GitHub 上の作業ブランチは自動で削除されます。手元は次のように片付けます。
  ```bash
  git switch main && git pull --ff-only && git fetch --prune && git branch -d <ブランチ名>
  ```
- ユーザーとのやりとりは日本語で行います。

## 設計上の注意
- 占い履歴は `~/Library/Application Support/com.toshiaki.arcanadesk/history.json` に保存されています。`Card` / `Reading` など履歴に保存される型の形を変えるときは、既存の履歴ファイルが読めなくならないようにしてください (例: 追加する項目に `#[serde(default)]` を付ける)。
- カードの絵は 2 段構えです。簡易版の SVG (`src/art.ts`、コードに含む) を常に描き、ドット絵 (`public/cards/NN.png`、NN はカード id) を読み込めたらその上に重ねます。ドット絵は git 管理外で、使う人が `make cards` で用意します (README の「カードの絵」)。画像をコミットしないでください。テストは画像に依存させず、画像が無い環境 (CI など) でもアプリとテストが動くようにしてください。
- カードの日本語名と意味は `src/meanings.ts` にあり、カード id (Rust の `Deck::new()` の並び順) で引いています。デッキの並び順を変えないでください。

## タロット占い仕様概要
- デッキ: 78枚 (大アルカナ22枚、小アルカナ56枚)
- スプレッド: ワンオラクル、スリーカード、ケルト十字
- 正逆判定: 50%の確率で逆位置 (`is_reversed`) を発生させる
