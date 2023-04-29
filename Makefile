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
