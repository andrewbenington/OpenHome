VERSION=0.1.0

.PHONY: build
build: 
	@npm run build

.PHONY: package
package:
	@npx ts-node ./.erb/scripts/clean.js dist && npm run build && electron-builder build --publish never

.PHONY: start
start: 
	@npm run start

.PHONY: test
test: 
	@npm run test

.PHONY: lint
lint: 
	@npm run lint
	
.PHONY: set-version
set-version:
	@npm version $(VERSION) --no-git-tag-version --allow-same-version
	@npm --prefix release/app version $(VERSION) --no-git-tag-version --allow-same-version

generate/out/generate.js: generate/generate.ts generate/syncPKHexResources.ts generate/enums.ts generate/parseFunctions/*
	@echo "compiling generate/*.ts..."
	@cd generate && tsc

.PHONY: generate
generate: generate/out/generate.js
	@echo "generating typescript..."
	@node ./generate/out/generate.js Items text/items/PostGen4.txt items/PostGen4.ts
	@npx prettier --loglevel silent --write src/resources/gen*

generate/out/syncPKHexResources.js: generate/syncPKHexResources.ts
	@echo "compiling generate/syncPKHexResources.ts..."
	@cd generate && tsc

.PHONY: sync-resources
sync-resources: generate/out
	@echo "syncing PKHex resources..."
	@node ./generate/out/syncPKHexResources.js
	@echo "syncing finished"
