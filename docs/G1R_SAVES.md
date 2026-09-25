# gen1recomp saves

OpenHome recognizes native gen1recomp `.lua` saves as G1R saves. Open the file
normally, move Pokémon between PC boxes or OpenHome, and use Save Changes to
write back to the same G1R file. No cartridge export, ROM, Lua interpreter, or
gen1recomp installation is needed by the adapter.

| Adapter   | Games                 | Supported schema                  | PC storage     |
| --------- | --------------------- | --------------------------------- | -------------- |
| Gen 1 G1R | Red, Blue, Yellow     | `meta.format = 4`                 | 12 boxes of 20 |
| Gen 2 G1R | Gold, Silver, Crystal | `format = 1..8`, `generation = 2` | 14 boxes of 20 |
| Gen 3 G1R | FireRed, LeafGreen    | `schemaVersion = 1`               | 14 boxes of 30 |

The game version comes from the save contents. These adapters cover the games
currently supported by gen1recomp; they do not treat arbitrary Lua programs or
other games' save schemas as G1R files. Unsupported Pokémon identifiers and
invalid box records stop the import with the box and slot in the error.

The PC boxes are editable. Party, daycare, inventory, story flags, mod data, and
other unrelated fields remain in the original save tree. Gen 1 and Gen 2 lists
compact after removal; Gen 3 preserves empty slots. Incoming non-Egg Pokémon
update the generation's Pokédex sets. Gen 2 Eggs retain their hatch counters.
Gen 1 cannot receive Eggs.

Unchanged files are returned byte for byte. Changed files are serialized as Lua
data, preserving numeric versus string keys, unknown fields, and binary string
values. Original Pokémon records are retained for unchanged or directly moved
Pokémon; edits and conversions merge known fields into an identifiable source
record when available. Custom per-Pokémon data has no representation in other
games' Pokémon formats and is not carried through external formats or storage.
Gen 3 writes the game's `cartImport` marker so gen1recomp rebuilds its derived
Pokémon fields on load.

The reader accepts only the serializer's data grammar and never executes Lua.
It bounds file size, nesting, and node count, and rejects duplicate keys and
executable expressions. Public tests use synthetic fixtures.

Implementation: `src/core/save/g1r`. The identifier tables contain the species,
move, and item IDs used by gen1recomp, indexed by their generation's numeric IDs.

Run focused tests with:

```sh
pnpm exec vitest run src/core/save/g1r
```

For desktop testing, use `pnpm tauri dev` after installing the repository's
Node, pnpm, Rust, and wasm-pack prerequisites. Development mode still compiles
Rust and WebAssembly, but does not require building a release installer.
