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