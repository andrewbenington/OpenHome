.PHONY: generate
generate:
	@node generate/gen_ribbons.ts
	@node generate/gen_moves.ts
	@node generate/gen_abilities.ts

.PHONY: build-wasm
build-wasm: # Generate WASM from Rust code
	@wasm-pack build --target web