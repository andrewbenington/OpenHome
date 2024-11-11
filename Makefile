VERSION=0.5.0
.PHONY: help
help: # Display this help.
	@awk 'BEGIN {FS = ":.*#"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?#/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^#@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: build
build:
	@npm run build

.PHONY: package
package:
	@npm run build:all

.PHONY: start
start:
	@npm run dev:unix

.PHONY: preview
preview:
	@npm run start

.PHONY: test
test:
	@npm run test

.PHONY: lint
lint:
	@npm run lint

.PHONY: check
check:
	@npm run typecheck
	@npm run lint
	@npm run format

.PHONY: set-version
set-version:
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

.PHONY: test-interfaces
test-interfaces:
	@ts-node --project tsconfig.json src/types/pkm_old/__test__/all.test.ts

%:
	@npm run $@