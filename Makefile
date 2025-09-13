VERSION=1.4.13

.PHONY: help
help: # Display this help.
	@awk 'BEGIN {FS = ":.*#"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?#/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^#@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: build-mac-arm
build-mac-arm:
	@npx tauri build --target aarch64-apple-darwin

.PHONY: build-mac-intel
build-mac-intel:
	@npx tauri build --target x86_64-apple-darwin

.PHONY: build-wasm
build-wasm: # Generate WASM from Rust code
	@cd packages/pokemon-files && wasm-pack build --target web

.PHONY: start
start:
	@npm run tauri dev

.PHONY: build-appimage
build-appimage:
	@npx tauri build -b appimage

.PHONY: bundle-appimage
bundle-appimage:
	@npx tauri bundle -b appimage

.PHONY: preview
preview:
	@npm run start

.PHONY: lint
lint:
	@npm run lint

.PHONY: clean
clean:
	@rm -rf src-tauri/target

.PHONY: check
check:
	@npm run typecheck
	@npm run lint
	@npm run format

.PHONY: check-rs
check-rs:
	@cd src-tauri && cargo clippy -- -Aclippy::needless_return

.PHONY: set-version
set-version:
	@jq --arg new_version "$(VERSION)" '.version = "$(VERSION)"' "src-tauri/tauri.conf.json" > version.tmp.json && mv version.tmp.json src-tauri/tauri.conf.json
	@npx prettier --write src-tauri/tauri.conf.json
	@cd src-tauri && cargo set-version $(VERSION)
	@npm version $(VERSION) --no-git-tag-version --allow-same-version

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
	@npm run $@
