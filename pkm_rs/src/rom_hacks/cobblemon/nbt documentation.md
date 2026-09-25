# Pokemon structure for Cobblemon

In Cobblemon, Pokemon are stored as NBT data in the world directory. Minecraft can be played as a multiplayer game, so a world may contain multiple sets of parties and box storage.

Box storage is located here relative to the world folder: `pokemon/pcstore/<first two characters of player UUID>/<player UUID>.dat`

Party storage is located here relative to the world folder: `pokemon/playerpartystore/<first two characters of player UUID>/<player UUID>.dat`

## Key structure

Note that many keys may be optional and aren't guaranteed to exist. This is described in detail later.

### Boxes

```
dat
├ BackupStore (Compound)
└ Box{0 thru (BoxCount-1)} (Compound)
  └ Slot{0-29} (Compound)
    └ Pokemon data, see "Pokemon structure" section below
  ├ BoxName (String)
  └ BoxWallpaper (String)
├ UnlockedWallpapers (List)
├ UnseenWallpapers (List)
├ BoxCount (Int)
└ BoxCountLocked (Bool)
```

### Party

```
dat
├ Slot{0 thru (SlotCount-1)} (Compound)
  └ Pokemon data, see "Pokemon structure" section below
└ SlotCount (Int)
```

### Pokemon structure

```
Slot# (Compound)
  ├ Ability (Compound)
    ├ AbilityIndex (Int)
    ├ AbilityName (String)
    └ AbilityPriority (String)
  ├ ActiveMark (String)
  ├ Alpha (Bool)
  ├ BenchedMoves (List)
  ├ CaughtBall (String)
  ├ cobblemon:dataversion (Int)
  ├ CosmeticItem (Compound)
  ├ DmaxLevel (Int)
  ├ Evolutions (Compound)
  ├ EVs (Compound)
  ├ Experience (Int)
  ├ Features (List)
  ├ FaintedTimer (Int)
  ├ FormId (String)
  ├ Friendship (Int)
  ├ Gender (String)
  ├ GmaxFactor (Bool)
  ├ HealingTimer (Int)
  ├ Health (Int)
  ├ HeldItem (Compound)
  ├ HeldItemDroppableByAI (Bool)
  ├ HeldItemVisible (Bool)
  ├ IVs (Compound)
  ├ Level (Int)
  ├ Marks (List)
  ├ MintedNature (String)
  ├ MoveSet (List)
  ├ Nature (String)
  ├ PersistentData (Compound)
  ├ PokemonOriginalTrainer (String)
  ├ PokemonOriginalTrainerType (String)
  ├ RideBoosts (Compound)
  ├ ScaleModifier (Float)
  ├ Shiny (Bool)
  ├ Species (String)
  ├ TeraType (String)
  ├ Tradeable (Bool)
  └ UUID (Int Array)
```

## Box NBT

### Box

Required compound named `Box#`, where `#` is a number between 0 and [`BoxCount`](#boxcount) minus one, inclusive.

A box is merely a container for the Pokemon it holds, as well as per-box preferences set by the player.

#### Slot

[Pokemon slot]() named `Slot#`, where `#` is a number between 0 and 29, inclusive.

#### `BoxName`

Optional string. At most 19 characters long.

This is the box name.

#### `BoxWallpaper`

Required string.

This is the chosen wallpaper for the box. It will always be a mod asset filepath to a .png texture.

### `UnlockedWallpapers`

Required list. May be empty.

This is a list of the wallpapers the player has unlocked.

We don't need to read this.

### `UnseenWallpapers`

Required list. May be empty.

We don't need to read this.

### `BoxCount`

Required int.

The number of boxes the player has. This is based on Cobblemon's mod config, which defaults to 40.

Because the box count can be configured, it can be any positive integer, so we should read this to know how many boxes the NBT file contains.

### `BoxCountLocked`

Required bool.

We don't need to read this.

## Party NBT

The party NBT only contains Pokemon slots and `SlotCount`.

### Slot

[Pokemon slot]() named `Slot#`, where `#` is a number between 0 and [`SlotCount`](#slotcount) minus one, inclusive.

### `SlotCount`

Required int, range 1-6.

The number of usable slots in the player's party.

We don't need to read this.

## Pokemon slot

Pokemon slots are only defined in the NBT when a Pokemon is actually occupying the slot. The number in the slot's name defines the slot the Pokemon is occupying.

If a Pokemon is invalid, it may disappear.

### `Ability`

Required compound.

#### `AbilityIndex`

Required int.

Set to 0 if the first Ability slot is in use, and 1 if the second Ability slot is in use.

#### `AbilityName`

Required string.

The name of the Pokemon's Ability.

#### `AbilityPriority`

Optional string.

Exists and is set to `"LOW"` if the Pokemon has its Hidden Ability.

### `ActiveMark`

Optional string.

The currently active [mark](https://wiki.cobblemon.com/index.php/Mark).

Must be a resource identifier that also exists in [`Marks`](#marks).

### `Alpha`

Optional bool.

Set if the Pokemon is an Alpha Pokemon.

Alpha Pokemon should also always have the Alpha Mark (`cobblemon:mark_alpha`) in [`Marks`](#marks). It doesn't necessarily need to be the active mark. Missing this isn't ideal, but is still okay; Cobblemon will automatically add the Alpha Mark if it's missing.

### `BenchedMoves`

Required list. May be empty.

Any [moves](#move) that the Pokemon has previously known. In Cobblemon, moves that have since been forgotten are placed here, so that special moves (TM, tutor, arbitrary) can be retaught later.

### `CaughtBall`

Required string.

Set to the [resource identifier](https://gitlab.com/cable-mc/cobblemon/-/blob/main/common/src/main/kotlin/com/cobblemon/mod/common/api/pokeball/PokeBalls.kt#L56) of the Poke Ball the Pokemon was originally caught in.

### `cobblemon:dataversion`

Required int.

In the current version of Cobblemon, this is set to `2`.

### `CosmeticItem`

Optional compound.

Contains an [item](#item).

This slot can only hold specific items that are used for certain [cosmetic forms](https://wiki.cobblemon.com/index.php/Cosmetics). Keep in mind, however, that addons can potentially add more valid cosmetic forms than what is included in the base Cobblemon mod.

### `DmaxLevel`

Required int.

Specifies the Pokemon's Dynamax level, for use in Mega Showdown.

Must be between 0 and 10, inclusive.

### `Evolutions`

Required compound.

#### `pending`

Required list. May be empty.

<!-- TODO: document -->

#### `progress`

Required list. May be empty.

<!-- TODO: document -->

### `EVs`

Required compound. 6 items.

Contains 6 required ints:

- `cobblemon:attack` - the Pokemon's Attack EVs
- `cobblemon:defence` - the Pokemon's Defense EVs
- `cobblemon:hp` - the Pokemon's HP EVs
- `cobblemon:special_attack` - the Pokemon's Special Attack EVs
- `cobblemon:special_defence` - the Pokemon's Special Defense EVs
- `cobblemon:speed` - the Pokemon's Speed EVs

Each int must be between 0 and 252, inclusive. The sum of all ints must not exceed 510.

### `Experience`

Required int.

The number of experience points the Pokemon has.

### `Features`

Required compound.

Contains one or more [species features](#species-feature).

In my testing, a `dynamax_level` species feature is always added, but never incremented. Additionally, the `blocks_traveled` species feature is always added.

### `FaintedTimer`

Required int.

If the Pokemon hasn't fainted, or if recovering from fainting is disabled in the mod config, this is set to `-1`. Otherwise, it is set to the fainting recovery time configured in the mod, in seconds. It decreases every second, and when it hits 0, the Pokemon recovers from fainting.

This value should be saved as-is, as a `u16`.

### `FormId`

Required string.

For most Pokemon, this is set to `normal`. <!-- TODO: which Pokemon don't? -->

### `Friendship`

Required int.

The Pokemon's friendship with the current Trainer. Starts at 50 (150 if in a Friend Ball).

### `Gender`

Required string.

The Pokemon's gender.

Must be one of `MALE`, `FEMALE`, or `GENDERLESS`.

### `GmaxFactor`

Required bool.

If set, the Pokemon has the Gigantamax factor, for use in Mega Showdown.

### `Health`

Required int.

The Pokemon's current health.

Must be at least 0.

### `HeldItem`

Optional compound.

Contains an [item](#item).

This slot can hold *any* Minecraft item.

### `HeldItemDroppableByAI`

Required bool.

Determines whether the held item can be dropped by the Pokemon's AI.

Should be saved as-is.

### `HeldItemVisible`

Required bool.

The player can toggle whether the Pokemon's held item is visible on its model (for example, Pikachu can be visibly seen holding its item), useful for competitive where items aren't meant to be visible. This preference is stored here.

Should be saved as-is.

### `IVs`

Required compound. 2 items.

#### `Base`

Required compound. 6 items.

Contains 6 required ints:

- `cobblemon:attack` - the Pokemon's Attack IVs
- `cobblemon:defence` - the Pokemon's Defense IVs
- `cobblemon:hp` - the Pokemon's HP IVs
- `cobblemon:special_attack` - the Pokemon's Special Attack IVs
- `cobblemon:special_defence` - the Pokemon's Special Defense IVs
- `cobblemon:speed` - the Pokemon's Speed IVs

Each int must be in the inclusive range 0-31.

#### `HyperTrained`

Required compound. May be empty. Can have up to 6 items.

May contain 6 optional ints:

- `cobblemon:attack` - the Pokemon's effective Attack IVs
- `cobblemon:defence` - the Pokemon's effective Defense IVs
- `cobblemon:hp` - the Pokemon's effective HP IVs
- `cobblemon:special_attack` - the Pokemon's effective Special Attack IVs
- `cobblemon:special_defence` - the Pokemon's effective Special Defense IVs
- `cobblemon:speed` - the Pokemon's effective Speed IVs

Each int must be in the inclusive range 0-31.

For context: In the official games, Hyper Training is simply a bool that determines whether a stat's IV is effectively 31. Cobblemon changes this to where you can precisely decide a stat's effective IV using [candies](https://wiki.cobblemon.com/index.php/Hyper_Training).

### `Level`

Required int.

The Pokemon's current level.

### `Marks`

Optional list.

Each list entry is a [mark](https://wiki.cobblemon.com/index.php/Mark) that the Pokemon has. Each mark is a string containing its resource identifier.

In spite of what is officially documented, ribbons are also in base Cobblemon! Internally, they are considered the same as marks. The ribbons and marks in base Cobblemon can be found [here](https://gitlab.com/cable-mc/cobblemon/-/tree/main/common/src/main/resources/data/cobblemon/marks).

Note that addons, such as [Cobblemarks+](https://modrinth.com/datapack/cobblemarks%2B), may add fan-made marks, and if the addon is not installed in the world the Pokemon is being moved to, the mark will be removed.

### `MintedNature`

Optional string.

Set to the [resource identifier](https://gitlab.com/cable-mc/cobblemon/-/blob/main/common/src/main/kotlin/com/cobblemon/mod/common/api/pokemon/Natures.kt#L24) of the Pokemon's *effective* Nature, after it has consumed a mint.

### `MoveSet`

Required list. 1-4 items.

[Moves](#move) that the Pokemon currently knows.

### `Nature`

Required string.

Set to the [resource identifier](https://gitlab.com/cable-mc/cobblemon/-/blob/main/common/src/main/kotlin/com/cobblemon/mod/common/api/pokemon/Natures.kt#L24) of the Pokemon's original Nature.

### `PersistentData`

Required compound. May be empty.

Any information stored in this compound will never be removed.

The Pokemon's OpenHome ID will be stored here as an int array, `OHID`.

### `PokemonOriginalTrainer`

Required string.

Contains either...

- The player [UUID](https://minecraft.wiki/w/UUID) of the Original Trainer, if [`PokemonOriginalTrainerType`](#pokemonoriginaltrainertype) is `PLAYER`.
- A name between 3 and 16 characters long, inclusive, if [`PokemonOriginalTrainerType`](#pokemonoriginaltrainertype) is `NPC`.

A player UUID can be used to [query Mojang](https://minecraft.wiki/w/Mojang_API#Query_player's_username) for the player's username, which can be used as the OT name in OHPKM.

### `PokemonOriginalTrainerType`

Required string.

Determines the type of Original Trainer.

This must be `PLAYER` or `NPC`.

For a Pokemon originating from Cobblemon, this value should be stored as-is. Addon mods may gift Pokemon to the player with an arbitrary OT name, which is not possible unless the `PokemonOriginalTrainerType` is `NPC`.

For a Pokemon that did not originate from Cobblemon, its `PokemonOriginalTrainerType` must be `NPC`, or the OT [will be considered invalid](https://gitlab.com/cable-mc/cobblemon/-/blob/main/common/src/main/kotlin/com/cobblemon/mod/common/api/pokemon/PokemonProperties.kt#L467).

### `RideBoosts`

Optional compound.

This contains five floats, which correspond to the Pokemon's [riding stat](https://wiki.cobblemon.com/index.php/Pok%C3%A9mon/Riding#Riding_Stats) boosts from consuming [Aprijuices](https://wiki.cobblemon.com/index.php/Aprijuice):

- `ACCELERATION`
- `JUMP`
- `SKILL`
- `STAMINA`
- `SPEED`

This should be saved as-is.

### `ScaleModifier`

Required float.

Ignored if [`Alpha`](#alpha) is set.

<!-- TODO: document -->

### `Shiny`

Required bool.

If set, the Pokemon is Shiny.

Other formats often lack this in the struct because Shininess is determined some other way, usually by deriving from the personality value. Cobblemon instead stores Shininess separately, since the Shiny rate is configurable.

### `Species`

Required string.

Set to the [resource identifier](https://gitlab.com/cable-mc/cobblemon/-/tree/main/common/src/main/resources/data/cobblemon/species) for the Pokemon's species.

### `TeraType`

Required string.

Set to the [resource identifier](https://gitlab.com/cable-mc/cobblemon/-/blob/main/common/src/main/kotlin/com/cobblemon/mod/common/api/types/tera/TeraTypes.kt#L22) for the Pokemon's Tera Type, for use in Mega Showdown. (The Stellar type is [`stellar`](https://gitlab.com/cable-mc/cobblemon/-/blob/main/common/src/main/kotlin/com/cobblemon/mod/common/api/types/tera/gimmick/StellarTeraType.kt#L29).)

### `Tradeable`

Required bool.

If set, the Pokemon can't be traded with other players in multiplayer.

Should be saved as-is.

### `UUID`

Required int array.

The Pokemon's entity [UUID](https://minecraft.wiki/w/UUID), an array of four signed 32-bit ints (`[i32; 4]`).

This UUID serves no purpose other than to uniquely identify the Pokemon as an entity in the Minecraft world.

It should be regenerated when depositing the Pokemon back into Cobblemon later, as it's possible the UUID may be in use by another entity. UUID collisions, unlikely as they may be, will cause the Pokemon to be considered invalid. This isn't really possible to avoid theoretically, but the odds of a collision happening with a newly generated UUID are extremely low.

## Other structures

### Species feature

A [species feature](https://wiki.cobblemon.com/index.php/Species_Features) is a special property for certain Pokemon, used to define certain special forms.

See [here](https://gitlab.com/cable-mc/cobblemon/-/tree/main/common/src/main/resources/data/cobblemon/species_features) and [here](https://gitlab.com/cable-mc/cobblemon/-/tree/main/common/src/main/resources/data/cobblemon/global_species_features) for the base Cobblemon mod's species features.

See [here](https://github.com/yajatkaul/CobblemonMegaShowdown/tree/main/common/src/main/resources/data/cobblemon/species_features) for Mega Showdown's species features.

Each species feature is a compound with two items.

#### `cobblemon:feature_id`

Required string.

The species feature's ID.

#### Value

This key holds the value of the feature. It is named the same as the value of `cobblemon:feature_id`. It may be any type, but is usually an int, bool, or string.

### Item

#### `count`

Required int.

The stack size of the item.

#### `id`

Required string.

Set to the resource identifier of the item.

### Move

#### `MoveName`

Required string.

The move's resource identifier.

#### `MovePP`

Int. Required only if the move is in [`MoveSet`](#moveset).

The move's remaining PP.

#### `RaisedPPStages`

Required int.

The number of PP Ups that have been used for this move.
