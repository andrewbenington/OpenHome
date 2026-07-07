VERSION=1.13.1

.PHONY: help
help: # Display this help.
	@awk 'BEGIN {FS = ":.*#"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?#/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^#@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: wasm-compile
wasm-compile:
	@pnpm i
	@pnpm wasm-compile-dev

.PHONY: start
start: ensure-dependencies
	@pnpm i
	@pnpm tauri dev

.PHONY: preview
preview:
	@pnpm run start

.PHONY: lint
lint:
	@pnpm run lint

.PHONY: clean
clean:
	@cargo clean
	@rm -rf node_modules
	@cd generate && rm -rf node_modules && rm -rf .venv && rm -rf __pycache__
	@cd generate/scrape-assets && rm -rf node_modules && rm -rf .venv && rm -rf __pycache__
	@cd pkhex-json && dotnet clean

.PHONY: check
check: wasm-compile
	@pnpm run typecheck
	@pnpm run lint
	@pnpm run format

.PHONY: test
test: ensure-dependencies
	@pnpm run test
	@npx eslint --fix ./src/core/tauri/spectaCommands.ts

.PHONY: check-rs
check-rs:
	@cd src-tauri && cargo clippy -- -Aclippy::needless_return

.PHONY: ensure-pnpm
ensure-pnpm:
ifeq ($(shell which pnpm 2>/dev/null), )
	@echo "pnpm not installed! installing..."
	@curl -fsSL https://get.pnpm.io/install.sh | sh -
endif

.PHONY: ensure-wasm-pack
ensure-wasm-pack:
ifeq ($(shell which wasm-pack 2>/dev/null), )
	@echo "wasm-pack not installed! installing..."
	@cargo install wasm-pack
endif

.PHONY: ensure-dependencies
ensure-dependencies: ensure-pnpm ensure-wasm-pack

.PHONY: set-version
set-version:
	@jq --arg new_version "$(VERSION)" '.version = "$(VERSION)"' "src-tauri/tauri.conf.json" > version.tmp.json && mv version.tmp.json src-tauri/tauri.conf.json
	@npx prettier --write src-tauri/tauri.conf.json
	@cargo install cargo-edit
	@cd src-tauri && cargo set-version $(VERSION)
	@cd pkm_rs && cargo set-version $(VERSION)
	@cd pkm_rs_derive && cargo set-version $(VERSION)
	@cd pkm_rs_resources && cargo set-version $(VERSION)
	@cd pkm_rs_types && cargo set-version $(VERSION)
	@cd pkm_rs && cargo build
	@cd src-tauri && cargo build
	@pnpm version $(VERSION) --no-git-tag-version --allow-same-version 
	@pnpm i

.PHONY: build-appimage
build-appimage:
	@npx tauri build -b appimage

.PHONY: bundle-appimage
bundle-appimage:
	@npx tauri bundle -b appimage

.PHONY: build-mac-arm
build-mac-arm:
	@npx tauri build --target aarch64-apple-darwin

.PHONY: build-mac-intel
build-mac-intel:
	@npx tauri build --target x86_64-apple-darwin

.PHONY: release-mac-arm
release-mac-arm: build-mac-arm
	@source .env && ./scripts/upload-bin.sh $(shell pwd)/target/aarch64-apple-darwin/release/bundle/dmg OpenHome

.PHONY: release-mac-intel
release-mac-intel: build-mac-intel
	@source .env && ./scripts/upload-bin.sh $(shell pwd)/target/x86_64-apple-darwin/release/bundle/dmg OpenHome

.PHONY: release-mac
release-mac: release-mac-arm release-mac-intel

generate/out/generate.js: generate/generate.ts generate/syncPKHexResources.ts generate/enums.ts generate/parseFunctions/*
	@echo "compiling generate/*.ts..."
	@cd generate && tsc

.PHONY: generate
generate: gen-wasm gen-tauri-commands

.PHONY: gen-wasm
gen-wasm:
# 	@node generate/gen_ribbons.ts
# 	@ts-node generate/gen_abilities.ts
	@ts-node generate/gen_abilities.ts
	@ts-node generate/gen_items.ts
	@ts-node generate/gen_moves.ts
	@ts-node generate/gen_species_data.ts
	@cd pkm_rs_resources && cargo fmt

.PHONY: gen-tauri-commands
gen-tauri-commands:
	@cargo test --package OpenHome --lib -- tests::export_typescript_bindings --exact --nocapture --include-ignored
	@npx eslint --fix ./src/core/tauri/spectaCommands.ts

.PHONY: pkhex-json
pkhex-json:
	@cd pkhex-json && dotnet run GeneratePkhexJson.cs
	@npx prettier --write pkhex-json

.PHONY: test-pkhex-json
test-pkhex-json:
	@cargo test --package pkm_rs --lib --all-features -- compare_pkhex_json

.PHONY: download-item-sprites
download-item-sprites:
	@python3 generate/downloadAllItems.py

%:
	@pnpm run $@

.PHONY: schema
schema:
	@sqlite3 generate/pkm.db .schema > generate/schema.sql

.PHONY: git-fix-pnpm
git-fix-pnpm:
	@pnpm i --merge-git-branch-lockfiles