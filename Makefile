# ArcanaDesk の開発・ビルド用コマンド
#
#   make dev    開発モードで起動 (コードを変えると自動で反映)
#   make app    リリース版の .app を作る
#   make dmg    配布用の .dmg を作る
#   make cards  カードのドット絵を用意する (任意)
#
# カードのドット絵は git 管理外で、アプリにも含めない。アプリは起動時に
# アプリのデータフォルダ (CARDS_DIR) の cards/NN.png を読み、あればそれを、
# 無ければ簡易版の SVG の絵を使う。画像を入れ替えたら起動し直すだけで反映される。
#
# macOS 標準の GNU Make 3.81 で動くように書いている。

BUNDLE_DIR := src-tauri/target/release/bundle
# tauri.conf.json の identifier に対応するアプリのデータフォルダ (履歴と同じ場所)。
# パスに空白を含むので、使うときは必ず "$(CARDS_DIR)" と引用符で囲む。
CARDS_DIR  := $(HOME)/Library/Application Support/com.toshiaki.arcanadesk/cards
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

# 原画 (約 66MB) を $(CARDS_SRC) に取得し、ドット絵に変換してアプリのデータフォルダへ書き出す。
# Pillow が必要。取得済みの原画は再利用するので、2 回目以降は変換だけになる。
cards: ## カードのドット絵を用意する (原画を取得して変換、任意)
	python3 -I scripts/fetch-cards.py "$(CARDS_SRC)"
	python3 -I scripts/pixelate-cards.py "$(CARDS_SRC)" "$(CARDS_DIR)"
	@echo ""
	@echo "書き出しました: $(CARDS_DIR)"
	@echo "アプリを起動し直すと反映されます (ビルドは不要です)。"

# 起動時にどちらの絵が使われるかを知らせる (ビルドには影響しない)
check-cards:
	@n=$$(ls "$(CARDS_DIR)" 2>/dev/null | grep -c '^[0-7][0-9]\.png$$'); \
	if [ "$$n" -ge 78 ]; then \
	  echo "カードの絵: 起動時に $(CARDS_DIR) のドット絵を使います。"; \
	elif [ "$$n" -gt 0 ]; then \
	  echo "カードの絵: $(CARDS_DIR) にドット絵が $$n 枚あります。無い札は簡易版の SVG の絵になります。"; \
	else \
	  echo "カードの絵: ドット絵が無いので、簡易版の SVG の絵を使います。"; \
	  echo "            ドット絵を使うには make cards を実行してください (README の「カードの絵」)。"; \
	fi
	@echo ""
