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

## タロット占い仕様概要
- デッキ: 78枚 (大アルカナ22枚、小アルカナ56枚)
- スプレッド: ワンオラクル、スリーカード、ケルト十字
- 正逆判定: 50%の確率で逆位置 (`is_reversed`) を発生させる
