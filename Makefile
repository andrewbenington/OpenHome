VERSION=1.9.0

.PHONY: help
help: # Display this help.
	@awk 'BEGIN {FS = ":.*#"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?#/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^#@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: build-mac-arm
build-mac-arm:
	@npx tauri build --target aarch64-apple-darwin

.PHONY: build-mac-intel
build-mac-intel:
	@npx tauri build --target x86_64-apple-darwin

.PHONY: start
start: ensure-dependencies
	@pnpm i
	@pnpm run tauri dev

.PHONY: build-appimage
build-appimage:
	@npx tauri build -b appimage

.PHONY: bundle-appimage
bundle-appimage:
	@npx tauri bundle -b appimage

.PHONY: preview
preview:
	@pnpm run start

.PHONY: lint
lint:
	@pnpm run lint

.PHONY: clean
clean:
	@rm -rf src-tauri/target

.PHONY: check
check:
	@pnpm run typecheck
	@pnpm run lint
	@pnpm run format

.PHONY: test
test: ensure-dependencies
	@pnpm run test
	@cargo test

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
	@pnpm version $(VERSION) --no-git-tag-version --allow-same-version 

.PHONY: release-mac
release-mac:
	@source .env && npm run release-mac

generate/out/generate.js: generate/generate.ts generate/syncPKHexResources.ts generate/enums.ts generate/parseFunctions/*
	@echo "compiling generate/*.ts..."
	@cd generate && tsc

.PHONY: generate
generate: generate/out/generate.js
	@echo "generating typescript..."
	@node ./generate/out/generate.js Items text/items/PostGen4.txt items/PostGen4.ts
	@npx prettier --log-level silent --write src/resources/gen*

.PHONY: gen-wasm
gen-wasm:
# 	@node generate/gen_ribbons.ts
# 	@cd pkm_rs_resources && node generate/gen_abilities.ts
	@cd generate
	@pnpm i
# 	@cd pkm_rs_resources && ts-node generate/gen_abilities.ts
	@ts-node generate/gen_items.ts
	@ts-node generate/gen_moves.ts
	@ts-node generate/gen_species_data.ts
	@cd pkm_rs_resources && cargo fmt
	
generate/out/syncPKHexResources.js: generate/syncPKHexResources.ts
	@echo "compiling generate/syncPKHexResources.ts..."
	@cd generate && tsc

.PHONY: sync-resources
sync-resources: generate/out
	@echo "syncing PKHex resources..."
	@node ./generate/out/syncPKHexResources.js
	@echo "syncing finished"

.PHONY: download-item-sprites
download-item-sprites:
	@python3 generate/downloadAllItems.py

%:
	@pnpm run $@

.PHONY: schema
schema:
	@sqlite3 generate/pkm.db .schema > generate/schema.sql