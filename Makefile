# ArcanaDesk の開発・ビルド用コマンド
#
#   make dev    開発モードで起動 (コードを変えると自動で反映)
#   make app    リリース版の .app を作る
#   make dmg    配布用の .dmg を作る
#   make cards  カードのドット絵を用意する (任意)
#
# カードのドット絵 (public/cards/) は git 管理外で、各自が用意するもの。
# dev / app / dmg は、ドット絵があればそれを、無ければ簡易版の SVG の絵を使う。
#
# macOS 標準の GNU Make 3.81 で動くように書いている。

BUNDLE_DIR := src-tauri/target/release/bundle
CARDS_DIR  := public/cards
CARDS_SRC  := .cards-src

.DEFAULT_GOAL := help
.PHONY: help dev app dmg cards check-cards

help: ## コマンドの一覧を表示
	@echo "使い方: make <コマンド>"
	@echo ""
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/^([a-z-]+):.*## (.*)/  \1	\2/'

# package.json か pnpm-lock.yaml が node_modules より新しければ入れ直す
node_modules: package.json pnpm-lock.yaml
	pnpm install --frozen-lockfile
	@touch node_modules

dev: node_modules check-cards ## 開発モードで起動 (pnpm tauri dev)
	pnpm tauri dev

app: node_modules check-cards ## リリース版の .app を作る
	pnpm tauri build --bundles app
	@echo ""
	@echo "作成しました: $(BUNDLE_DIR)/macos/ArcanaDesk.app"

# dmg だけを指定すると、Tauri は途中で作った .app を消してしまう。
# make app で作った .app が消えないよう、.app も一緒に作る。
dmg: node_modules check-cards ## 配布用の .dmg を作る (.app も一緒に作る)
	pnpm tauri build --bundles app,dmg
	@echo ""
	@echo "作成しました:"
	@echo "$(BUNDLE_DIR)/macos/ArcanaDesk.app"
	@ls -1 $(BUNDLE_DIR)/dmg/*.dmg

# 原画 (約 66MB) を $(CARDS_SRC) に取得してドット絵に変換する。Pillow が必要。
# 取得済みの原画は再利用するので、2 回目以降は変換だけになる。
cards: ## カードのドット絵を用意する (原画を取得して変換、任意)
	python3 -I scripts/fetch-cards.py $(CARDS_SRC)
	python3 -I scripts/pixelate-cards.py $(CARDS_SRC) $(CARDS_DIR)

# どちらの絵でビルドするかを知らせる
check-cards:
	@if [ -d $(CARDS_DIR) ] && [ $$(ls $(CARDS_DIR) 2>/dev/null | grep -c '\.png$$') -ge 78 ]; then \
	  echo "カードの絵: ドット絵 ($(CARDS_DIR)) を使います。"; \
	else \
	  echo "カードの絵: ドット絵が無いので、簡易版の SVG の絵を使います。"; \
	  echo "            ドット絵を使うには make cards を実行してください (README の「カードの絵」)。"; \
	fi
	@echo ""
