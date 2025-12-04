use crate::items::ItemMetadata;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

pub const ITEM_MAX: usize = 2632;

#[allow(clippy::missing_const_for_fn)]
#[wasm_bindgen(js_name = "getAllItems")]
#[cfg(feature = "wasm")]
pub fn get_all_items() -> Vec<ItemMetadata> {
    ALL_ITEMS.into_iter().copied().collect()
}

pub static ALL_ITEMS: [&ItemMetadata; ITEM_MAX] = [
    &ItemMetadata {
        id: 1,
        name: "Master Ball",
    },
    &ItemMetadata {
        id: 2,
        name: "Ultra Ball",
    },
    &ItemMetadata {
        id: 3,
        name: "Great Ball",
    },
    &ItemMetadata {
        id: 4,
        name: "Poké Ball",
    },
    &ItemMetadata {
        id: 5,
        name: "Safari Ball",
    },
    &ItemMetadata {
        id: 6,
        name: "Net Ball",
    },
    &ItemMetadata {
        id: 7,
        name: "Dive Ball",
    },
    &ItemMetadata {
        id: 8,
        name: "Nest Ball",
    },
    &ItemMetadata {
        id: 9,
        name: "Repeat Ball",
    },
    &ItemMetadata {
        id: 10,
        name: "Timer Ball",
    },
    &ItemMetadata {
        id: 11,
        name: "Luxury Ball",
    },
    &ItemMetadata {
        id: 12,
        name: "Premier Ball",
    },
    &ItemMetadata {
        id: 13,
        name: "Dusk Ball",
    },
    &ItemMetadata {
        id: 14,
        name: "Heal Ball",
    },
    &ItemMetadata {
        id: 15,
        name: "Quick Ball",
    },
    &ItemMetadata {
        id: 16,
        name: "Cherish Ball",
    },
    &ItemMetadata {
        id: 17,
        name: "Potion",
    },
    &ItemMetadata {
        id: 18,
        name: "Antidote",
    },
    &ItemMetadata {
        id: 19,
        name: "Burn Heal",
    },
    &ItemMetadata {
        id: 20,
        name: "Ice Heal",
    },
    &ItemMetadata {
        id: 21,
        name: "Awakening",
    },
    &ItemMetadata {
        id: 22,
        name: "Paralyze Heal",
    },
    &ItemMetadata {
        id: 23,
        name: "Full Restore",
    },
    &ItemMetadata {
        id: 24,
        name: "Max Potion",
    },
    &ItemMetadata {
        id: 25,
        name: "Hyper Potion",
    },
    &ItemMetadata {
        id: 26,
        name: "Super Potion",
    },
    &ItemMetadata {
        id: 27,
        name: "Full Heal",
    },
    &ItemMetadata {
        id: 28,
        name: "Revive",
    },
    &ItemMetadata {
        id: 29,
        name: "Max Revive",
    },
    &ItemMetadata {
        id: 30,
        name: "Fresh Water",
    },
    &ItemMetadata {
        id: 31,
        name: "Soda Pop",
    },
    &ItemMetadata {
        id: 32,
        name: "Lemonade",
    },
    &ItemMetadata {
        id: 33,
        name: "Moomoo Milk",
    },
    &ItemMetadata {
        id: 34,
        name: "Energy Powder",
    },
    &ItemMetadata {
        id: 35,
        name: "Energy Root",
    },
    &ItemMetadata {
        id: 36,
        name: "Heal Powder",
    },
    &ItemMetadata {
        id: 37,
        name: "Revival Herb",
    },
    &ItemMetadata {
        id: 38,
        name: "Ether",
    },
    &ItemMetadata {
        id: 39,
        name: "Max Ether",
    },
    &ItemMetadata {
        id: 40,
        name: "Elixir",
    },
    &ItemMetadata {
        id: 41,
        name: "Max Elixir",
    },
    &ItemMetadata {
        id: 42,
        name: "Lava Cookie",
    },
    &ItemMetadata {
        id: 43,
        name: "Berry Juice",
    },
    &ItemMetadata {
        id: 44,
        name: "Sacred Ash",
    },
    &ItemMetadata {
        id: 45,
        name: "HP Up",
    },
    &ItemMetadata {
        id: 46,
        name: "Protein",
    },
    &ItemMetadata {
        id: 47,
        name: "Iron",
    },
    &ItemMetadata {
        id: 48,
        name: "Carbos",
    },
    &ItemMetadata {
        id: 49,
        name: "Calcium",
    },
    &ItemMetadata {
        id: 50,
        name: "Rare Candy",
    },
    &ItemMetadata {
        id: 51,
        name: "PP Up",
    },
    &ItemMetadata {
        id: 52,
        name: "Zinc",
    },
    &ItemMetadata {
        id: 53,
        name: "PP Max",
    },
    &ItemMetadata {
        id: 54,
        name: "Old Gateau",
    },
    &ItemMetadata {
        id: 55,
        name: "Guard Spec.",
    },
    &ItemMetadata {
        id: 56,
        name: "Dire Hit",
    },
    &ItemMetadata {
        id: 57,
        name: "X Attack",
    },
    &ItemMetadata {
        id: 58,
        name: "X Defense",
    },
    &ItemMetadata {
        id: 59,
        name: "X Speed",
    },
    &ItemMetadata {
        id: 60,
        name: "X Accuracy",
    },
    &ItemMetadata {
        id: 61,
        name: "X Sp. Atk",
    },
    &ItemMetadata {
        id: 62,
        name: "X Sp. Def",
    },
    &ItemMetadata {
        id: 63,
        name: "Poké Doll",
    },
    &ItemMetadata {
        id: 64,
        name: "Fluffy Tail",
    },
    &ItemMetadata {
        id: 65,
        name: "Blue Flute",
    },
    &ItemMetadata {
        id: 66,
        name: "Yellow Flute",
    },
    &ItemMetadata {
        id: 67,
        name: "Red Flute",
    },
    &ItemMetadata {
        id: 68,
        name: "Black Flute",
    },
    &ItemMetadata {
        id: 69,
        name: "White Flute",
    },
    &ItemMetadata {
        id: 70,
        name: "Shoal Salt",
    },
    &ItemMetadata {
        id: 71,
        name: "Shoal Shell",
    },
    &ItemMetadata {
        id: 72,
        name: "Red Shard",
    },
    &ItemMetadata {
        id: 73,
        name: "Blue Shard",
    },
    &ItemMetadata {
        id: 74,
        name: "Yellow Shard",
    },
    &ItemMetadata {
        id: 75,
        name: "Green Shard",
    },
    &ItemMetadata {
        id: 76,
        name: "Super Repel",
    },
    &ItemMetadata {
        id: 77,
        name: "Max Repel",
    },
    &ItemMetadata {
        id: 78,
        name: "Escape Rope",
    },
    &ItemMetadata {
        id: 79,
        name: "Repel",
    },
    &ItemMetadata {
        id: 80,
        name: "Sun Stone",
    },
    &ItemMetadata {
        id: 81,
        name: "Moon Stone",
    },
    &ItemMetadata {
        id: 82,
        name: "Fire Stone",
    },
    &ItemMetadata {
        id: 83,
        name: "Thunder Stone",
    },
    &ItemMetadata {
        id: 84,
        name: "Water Stone",
    },
    &ItemMetadata {
        id: 85,
        name: "Leaf Stone",
    },
    &ItemMetadata {
        id: 86,
        name: "Tiny Mushroom",
    },
    &ItemMetadata {
        id: 87,
        name: "Big Mushroom",
    },
    &ItemMetadata {
        id: 88,
        name: "Pearl",
    },
    &ItemMetadata {
        id: 89,
        name: "Big Pearl",
    },
    &ItemMetadata {
        id: 90,
        name: "Stardust",
    },
    &ItemMetadata {
        id: 91,
        name: "Star Piece",
    },
    &ItemMetadata {
        id: 92,
        name: "Nugget",
    },
    &ItemMetadata {
        id: 93,
        name: "Heart Scale",
    },
    &ItemMetadata {
        id: 94,
        name: "Honey",
    },
    &ItemMetadata {
        id: 95,
        name: "Growth Mulch",
    },
    &ItemMetadata {
        id: 96,
        name: "Damp Mulch",
    },
    &ItemMetadata {
        id: 97,
        name: "Stable Mulch",
    },
    &ItemMetadata {
        id: 98,
        name: "Gooey Mulch",
    },
    &ItemMetadata {
        id: 99,
        name: "Root Fossil",
    },
    &ItemMetadata {
        id: 100,
        name: "Claw Fossil",
    },
    &ItemMetadata {
        id: 101,
        name: "Helix Fossil",
    },
    &ItemMetadata {
        id: 102,
        name: "Dome Fossil",
    },
    &ItemMetadata {
        id: 103,
        name: "Old Amber",
    },
    &ItemMetadata {
        id: 104,
        name: "Armor Fossil",
    },
    &ItemMetadata {
        id: 105,
        name: "Skull Fossil",
    },
    &ItemMetadata {
        id: 106,
        name: "Rare Bone",
    },
    &ItemMetadata {
        id: 107,
        name: "Shiny Stone",
    },
    &ItemMetadata {
        id: 108,
        name: "Dusk Stone",
    },
    &ItemMetadata {
        id: 109,
        name: "Dawn Stone",
    },
    &ItemMetadata {
        id: 110,
        name: "Oval Stone",
    },
    &ItemMetadata {
        id: 111,
        name: "Odd Keystone",
    },
    &ItemMetadata {
        id: 112,
        name: "Griseous Orb",
    },
    &ItemMetadata {
        id: 113,
        name: "Tea",
    },
    &ItemMetadata {
        id: 114,
        name: "???",
    },
    &ItemMetadata {
        id: 115,
        name: "Autograph",
    },
    &ItemMetadata {
        id: 116,
        name: "Douse Drive",
    },
    &ItemMetadata {
        id: 117,
        name: "Shock Drive",
    },
    &ItemMetadata {
        id: 118,
        name: "Burn Drive",
    },
    &ItemMetadata {
        id: 119,
        name: "Chill Drive",
    },
    &ItemMetadata {
        id: 120,
        name: "???",
    },
    &ItemMetadata {
        id: 121,
        name: "Pokémon Box Link",
    },
    &ItemMetadata {
        id: 122,
        name: "Medicine Pocket",
    },
    &ItemMetadata {
        id: 123,
        name: "TM Case",
    },
    &ItemMetadata {
        id: 124,
        name: "Candy Jar",
    },
    &ItemMetadata {
        id: 125,
        name: "Power-Up Pocket",
    },
    &ItemMetadata {
        id: 126,
        name: "Clothing Trunk",
    },
    &ItemMetadata {
        id: 127,
        name: "Catching Pocket",
    },
    &ItemMetadata {
        id: 128,
        name: "Battle Pocket",
    },
    &ItemMetadata {
        id: 129,
        name: "???",
    },
    &ItemMetadata {
        id: 130,
        name: "???",
    },
    &ItemMetadata {
        id: 131,
        name: "???",
    },
    &ItemMetadata {
        id: 132,
        name: "???",
    },
    &ItemMetadata {
        id: 133,
        name: "???",
    },
    &ItemMetadata {
        id: 134,
        name: "Sweet Heart",
    },
    &ItemMetadata {
        id: 135,
        name: "Adamant Orb",
    },
    &ItemMetadata {
        id: 136,
        name: "Lustrous Orb",
    },
    &ItemMetadata {
        id: 137,
        name: "Greet Mail",
    },
    &ItemMetadata {
        id: 138,
        name: "Favored Mail",
    },
    &ItemMetadata {
        id: 139,
        name: "RSVP Mail",
    },
    &ItemMetadata {
        id: 140,
        name: "Thanks Mail",
    },
    &ItemMetadata {
        id: 141,
        name: "Inquiry Mail",
    },
    &ItemMetadata {
        id: 142,
        name: "Like Mail",
    },
    &ItemMetadata {
        id: 143,
        name: "Reply Mail",
    },
    &ItemMetadata {
        id: 144,
        name: "Bridge Mail S",
    },
    &ItemMetadata {
        id: 145,
        name: "Bridge Mail D",
    },
    &ItemMetadata {
        id: 146,
        name: "Bridge Mail T",
    },
    &ItemMetadata {
        id: 147,
        name: "Bridge Mail V",
    },
    &ItemMetadata {
        id: 148,
        name: "Bridge Mail M",
    },
    &ItemMetadata {
        id: 149,
        name: "Cheri Berry",
    },
    &ItemMetadata {
        id: 150,
        name: "Chesto Berry",
    },
    &ItemMetadata {
        id: 151,
        name: "Pecha Berry",
    },
    &ItemMetadata {
        id: 152,
        name: "Rawst Berry",
    },
    &ItemMetadata {
        id: 153,
        name: "Aspear Berry",
    },
    &ItemMetadata {
        id: 154,
        name: "Leppa Berry",
    },
    &ItemMetadata {
        id: 155,
        name: "Oran Berry",
    },
    &ItemMetadata {
        id: 156,
        name: "Persim Berry",
    },
    &ItemMetadata {
        id: 157,
        name: "Lum Berry",
    },
    &ItemMetadata {
        id: 158,
        name: "Sitrus Berry",
    },
    &ItemMetadata {
        id: 159,
        name: "Figy Berry",
    },
    &ItemMetadata {
        id: 160,
        name: "Wiki Berry",
    },
    &ItemMetadata {
        id: 161,
        name: "Mago Berry",
    },
    &ItemMetadata {
        id: 162,
        name: "Aguav Berry",
    },
    &ItemMetadata {
        id: 163,
        name: "Iapapa Berry",
    },
    &ItemMetadata {
        id: 164,
        name: "Razz Berry",
    },
    &ItemMetadata {
        id: 165,
        name: "Bluk Berry",
    },
    &ItemMetadata {
        id: 166,
        name: "Nanab Berry",
    },
    &ItemMetadata {
        id: 167,
        name: "Wepear Berry",
    },
    &ItemMetadata {
        id: 168,
        name: "Pinap Berry",
    },
    &ItemMetadata {
        id: 169,
        name: "Pomeg Berry",
    },
    &ItemMetadata {
        id: 170,
        name: "Kelpsy Berry",
    },
    &ItemMetadata {
        id: 171,
        name: "Qualot Berry",
    },
    &ItemMetadata {
        id: 172,
        name: "Hondew Berry",
    },
    &ItemMetadata {
        id: 173,
        name: "Grepa Berry",
    },
    &ItemMetadata {
        id: 174,
        name: "Tamato Berry",
    },
    &ItemMetadata {
        id: 175,
        name: "Cornn Berry",
    },
    &ItemMetadata {
        id: 176,
        name: "Magost Berry",
    },
    &ItemMetadata {
        id: 177,
        name: "Rabuta Berry",
    },
    &ItemMetadata {
        id: 178,
        name: "Nomel Berry",
    },
    &ItemMetadata {
        id: 179,
        name: "Spelon Berry",
    },
    &ItemMetadata {
        id: 180,
        name: "Pamtre Berry",
    },
    &ItemMetadata {
        id: 181,
        name: "Watmel Berry",
    },
    &ItemMetadata {
        id: 182,
        name: "Durin Berry",
    },
    &ItemMetadata {
        id: 183,
        name: "Belue Berry",
    },
    &ItemMetadata {
        id: 184,
        name: "Occa Berry",
    },
    &ItemMetadata {
        id: 185,
        name: "Passho Berry",
    },
    &ItemMetadata {
        id: 186,
        name: "Wacan Berry",
    },
    &ItemMetadata {
        id: 187,
        name: "Rindo Berry",
    },
    &ItemMetadata {
        id: 188,
        name: "Yache Berry",
    },
    &ItemMetadata {
        id: 189,
        name: "Chople Berry",
    },
    &ItemMetadata {
        id: 190,
        name: "Kebia Berry",
    },
    &ItemMetadata {
        id: 191,
        name: "Shuca Berry",
    },
    &ItemMetadata {
        id: 192,
        name: "Coba Berry",
    },
    &ItemMetadata {
        id: 193,
        name: "Payapa Berry",
    },
    &ItemMetadata {
        id: 194,
        name: "Tanga Berry",
    },
    &ItemMetadata {
        id: 195,
        name: "Charti Berry",
    },
    &ItemMetadata {
        id: 196,
        name: "Kasib Berry",
    },
    &ItemMetadata {
        id: 197,
        name: "Haban Berry",
    },
    &ItemMetadata {
        id: 198,
        name: "Colbur Berry",
    },
    &ItemMetadata {
        id: 199,
        name: "Babiri Berry",
    },
    &ItemMetadata {
        id: 200,
        name: "Chilan Berry",
    },
    &ItemMetadata {
        id: 201,
        name: "Liechi Berry",
    },
    &ItemMetadata {
        id: 202,
        name: "Ganlon Berry",
    },
    &ItemMetadata {
        id: 203,
        name: "Salac Berry",
    },
    &ItemMetadata {
        id: 204,
        name: "Petaya Berry",
    },
    &ItemMetadata {
        id: 205,
        name: "Apicot Berry",
    },
    &ItemMetadata {
        id: 206,
        name: "Lansat Berry",
    },
    &ItemMetadata {
        id: 207,
        name: "Starf Berry",
    },
    &ItemMetadata {
        id: 208,
        name: "Enigma Berry",
    },
    &ItemMetadata {
        id: 209,
        name: "Micle Berry",
    },
    &ItemMetadata {
        id: 210,
        name: "Custap Berry",
    },
    &ItemMetadata {
        id: 211,
        name: "Jaboca Berry",
    },
    &ItemMetadata {
        id: 212,
        name: "Rowap Berry",
    },
    &ItemMetadata {
        id: 213,
        name: "Bright Powder",
    },
    &ItemMetadata {
        id: 214,
        name: "White Herb",
    },
    &ItemMetadata {
        id: 215,
        name: "Macho Brace",
    },
    &ItemMetadata {
        id: 216,
        name: "Exp. Share",
    },
    &ItemMetadata {
        id: 217,
        name: "Quick Claw",
    },
    &ItemMetadata {
        id: 218,
        name: "Soothe Bell",
    },
    &ItemMetadata {
        id: 219,
        name: "Mental Herb",
    },
    &ItemMetadata {
        id: 220,
        name: "Choice Band",
    },
    &ItemMetadata {
        id: 221,
        name: "King’s Rock",
    },
    &ItemMetadata {
        id: 222,
        name: "Silver Powder",
    },
    &ItemMetadata {
        id: 223,
        name: "Amulet Coin",
    },
    &ItemMetadata {
        id: 224,
        name: "Cleanse Tag",
    },
    &ItemMetadata {
        id: 225,
        name: "Soul Dew",
    },
    &ItemMetadata {
        id: 226,
        name: "Deep Sea Tooth",
    },
    &ItemMetadata {
        id: 227,
        name: "Deep Sea Scale",
    },
    &ItemMetadata {
        id: 228,
        name: "Smoke Ball",
    },
    &ItemMetadata {
        id: 229,
        name: "Everstone",
    },
    &ItemMetadata {
        id: 230,
        name: "Focus Band",
    },
    &ItemMetadata {
        id: 231,
        name: "Lucky Egg",
    },
    &ItemMetadata {
        id: 232,
        name: "Scope Lens",
    },
    &ItemMetadata {
        id: 233,
        name: "Metal Coat",
    },
    &ItemMetadata {
        id: 234,
        name: "Leftovers",
    },
    &ItemMetadata {
        id: 235,
        name: "Dragon Scale",
    },
    &ItemMetadata {
        id: 236,
        name: "Light Ball",
    },
    &ItemMetadata {
        id: 237,
        name: "Soft Sand",
    },
    &ItemMetadata {
        id: 238,
        name: "Hard Stone",
    },
    &ItemMetadata {
        id: 239,
        name: "Miracle Seed",
    },
    &ItemMetadata {
        id: 240,
        name: "Black Glasses",
    },
    &ItemMetadata {
        id: 241,
        name: "Black Belt",
    },
    &ItemMetadata {
        id: 242,
        name: "Magnet",
    },
    &ItemMetadata {
        id: 243,
        name: "Mystic Water",
    },
    &ItemMetadata {
        id: 244,
        name: "Sharp Beak",
    },
    &ItemMetadata {
        id: 245,
        name: "Poison Barb",
    },
    &ItemMetadata {
        id: 246,
        name: "Never-Melt Ice",
    },
    &ItemMetadata {
        id: 247,
        name: "Spell Tag",
    },
    &ItemMetadata {
        id: 248,
        name: "Twisted Spoon",
    },
    &ItemMetadata {
        id: 249,
        name: "Charcoal",
    },
    &ItemMetadata {
        id: 250,
        name: "Dragon Fang",
    },
    &ItemMetadata {
        id: 251,
        name: "Silk Scarf",
    },
    &ItemMetadata {
        id: 252,
        name: "Upgrade",
    },
    &ItemMetadata {
        id: 253,
        name: "Shell Bell",
    },
    &ItemMetadata {
        id: 254,
        name: "Sea Incense",
    },
    &ItemMetadata {
        id: 255,
        name: "Lax Incense",
    },
    &ItemMetadata {
        id: 256,
        name: "Lucky Punch",
    },
    &ItemMetadata {
        id: 257,
        name: "Metal Powder",
    },
    &ItemMetadata {
        id: 258,
        name: "Thick Club",
    },
    &ItemMetadata {
        id: 259,
        name: "Leek",
    },
    &ItemMetadata {
        id: 260,
        name: "Red Scarf",
    },
    &ItemMetadata {
        id: 261,
        name: "Blue Scarf",
    },
    &ItemMetadata {
        id: 262,
        name: "Pink Scarf",
    },
    &ItemMetadata {
        id: 263,
        name: "Green Scarf",
    },
    &ItemMetadata {
        id: 264,
        name: "Yellow Scarf",
    },
    &ItemMetadata {
        id: 265,
        name: "Wide Lens",
    },
    &ItemMetadata {
        id: 266,
        name: "Muscle Band",
    },
    &ItemMetadata {
        id: 267,
        name: "Wise Glasses",
    },
    &ItemMetadata {
        id: 268,
        name: "Expert Belt",
    },
    &ItemMetadata {
        id: 269,
        name: "Light Clay",
    },
    &ItemMetadata {
        id: 270,
        name: "Life Orb",
    },
    &ItemMetadata {
        id: 271,
        name: "Power Herb",
    },
    &ItemMetadata {
        id: 272,
        name: "Toxic Orb",
    },
    &ItemMetadata {
        id: 273,
        name: "Flame Orb",
    },
    &ItemMetadata {
        id: 274,
        name: "Quick Powder",
    },
    &ItemMetadata {
        id: 275,
        name: "Focus Sash",
    },
    &ItemMetadata {
        id: 276,
        name: "Zoom Lens",
    },
    &ItemMetadata {
        id: 277,
        name: "Metronome",
    },
    &ItemMetadata {
        id: 278,
        name: "Iron Ball",
    },
    &ItemMetadata {
        id: 279,
        name: "Lagging Tail",
    },
    &ItemMetadata {
        id: 280,
        name: "Destiny Knot",
    },
    &ItemMetadata {
        id: 281,
        name: "Black Sludge",
    },
    &ItemMetadata {
        id: 282,
        name: "Icy Rock",
    },
    &ItemMetadata {
        id: 283,
        name: "Smooth Rock",
    },
    &ItemMetadata {
        id: 284,
        name: "Heat Rock",
    },
    &ItemMetadata {
        id: 285,
        name: "Damp Rock",
    },
    &ItemMetadata {
        id: 286,
        name: "Grip Claw",
    },
    &ItemMetadata {
        id: 287,
        name: "Choice Scarf",
    },
    &ItemMetadata {
        id: 288,
        name: "Sticky Barb",
    },
    &ItemMetadata {
        id: 289,
        name: "Power Bracer",
    },
    &ItemMetadata {
        id: 290,
        name: "Power Belt",
    },
    &ItemMetadata {
        id: 291,
        name: "Power Lens",
    },
    &ItemMetadata {
        id: 292,
        name: "Power Band",
    },
    &ItemMetadata {
        id: 293,
        name: "Power Anklet",
    },
    &ItemMetadata {
        id: 294,
        name: "Power Weight",
    },
    &ItemMetadata {
        id: 295,
        name: "Shed Shell",
    },
    &ItemMetadata {
        id: 296,
        name: "Big Root",
    },
    &ItemMetadata {
        id: 297,
        name: "Choice Specs",
    },
    &ItemMetadata {
        id: 298,
        name: "Flame Plate",
    },
    &ItemMetadata {
        id: 299,
        name: "Splash Plate",
    },
    &ItemMetadata {
        id: 300,
        name: "Zap Plate",
    },
    &ItemMetadata {
        id: 301,
        name: "Meadow Plate",
    },
    &ItemMetadata {
        id: 302,
        name: "Icicle Plate",
    },
    &ItemMetadata {
        id: 303,
        name: "Fist Plate",
    },
    &ItemMetadata {
        id: 304,
        name: "Toxic Plate",
    },
    &ItemMetadata {
        id: 305,
        name: "Earth Plate",
    },
    &ItemMetadata {
        id: 306,
        name: "Sky Plate",
    },
    &ItemMetadata {
        id: 307,
        name: "Mind Plate",
    },
    &ItemMetadata {
        id: 308,
        name: "Insect Plate",
    },
    &ItemMetadata {
        id: 309,
        name: "Stone Plate",
    },
    &ItemMetadata {
        id: 310,
        name: "Spooky Plate",
    },
    &ItemMetadata {
        id: 311,
        name: "Draco Plate",
    },
    &ItemMetadata {
        id: 312,
        name: "Dread Plate",
    },
    &ItemMetadata {
        id: 313,
        name: "Iron Plate",
    },
    &ItemMetadata {
        id: 314,
        name: "Odd Incense",
    },
    &ItemMetadata {
        id: 315,
        name: "Rock Incense",
    },
    &ItemMetadata {
        id: 316,
        name: "Full Incense",
    },
    &ItemMetadata {
        id: 317,
        name: "Wave Incense",
    },
    &ItemMetadata {
        id: 318,
        name: "Rose Incense",
    },
    &ItemMetadata {
        id: 319,
        name: "Luck Incense",
    },
    &ItemMetadata {
        id: 320,
        name: "Pure Incense",
    },
    &ItemMetadata {
        id: 321,
        name: "Protector",
    },
    &ItemMetadata {
        id: 322,
        name: "Electirizer",
    },
    &ItemMetadata {
        id: 323,
        name: "Magmarizer",
    },
    &ItemMetadata {
        id: 324,
        name: "Dubious Disc",
    },
    &ItemMetadata {
        id: 325,
        name: "Reaper Cloth",
    },
    &ItemMetadata {
        id: 326,
        name: "Razor Claw",
    },
    &ItemMetadata {
        id: 327,
        name: "Razor Fang",
    },
    &ItemMetadata {
        id: 328,
        name: "TM01",
    },
    &ItemMetadata {
        id: 329,
        name: "TM02",
    },
    &ItemMetadata {
        id: 330,
        name: "TM03",
    },
    &ItemMetadata {
        id: 331,
        name: "TM04",
    },
    &ItemMetadata {
        id: 332,
        name: "TM05",
    },
    &ItemMetadata {
        id: 333,
        name: "TM06",
    },
    &ItemMetadata {
        id: 334,
        name: "TM07",
    },
    &ItemMetadata {
        id: 335,
        name: "TM08",
    },
    &ItemMetadata {
        id: 336,
        name: "TM09",
    },
    &ItemMetadata {
        id: 337,
        name: "TM10",
    },
    &ItemMetadata {
        id: 338,
        name: "TM11",
    },
    &ItemMetadata {
        id: 339,
        name: "TM12",
    },
    &ItemMetadata {
        id: 340,
        name: "TM13",
    },
    &ItemMetadata {
        id: 341,
        name: "TM14",
    },
    &ItemMetadata {
        id: 342,
        name: "TM15",
    },
    &ItemMetadata {
        id: 343,
        name: "TM16",
    },
    &ItemMetadata {
        id: 344,
        name: "TM17",
    },
    &ItemMetadata {
        id: 345,
        name: "TM18",
    },
    &ItemMetadata {
        id: 346,
        name: "TM19",
    },
    &ItemMetadata {
        id: 347,
        name: "TM20",
    },
    &ItemMetadata {
        id: 348,
        name: "TM21",
    },
    &ItemMetadata {
        id: 349,
        name: "TM22",
    },
    &ItemMetadata {
        id: 350,
        name: "TM23",
    },
    &ItemMetadata {
        id: 351,
        name: "TM24",
    },
    &ItemMetadata {
        id: 352,
        name: "TM25",
    },
    &ItemMetadata {
        id: 353,
        name: "TM26",
    },
    &ItemMetadata {
        id: 354,
        name: "TM27",
    },
    &ItemMetadata {
        id: 355,
        name: "TM28",
    },
    &ItemMetadata {
        id: 356,
        name: "TM29",
    },
    &ItemMetadata {
        id: 357,
        name: "TM30",
    },
    &ItemMetadata {
        id: 358,
        name: "TM31",
    },
    &ItemMetadata {
        id: 359,
        name: "TM32",
    },
    &ItemMetadata {
        id: 360,
        name: "TM33",
    },
    &ItemMetadata {
        id: 361,
        name: "TM34",
    },
    &ItemMetadata {
        id: 362,
        name: "TM35",
    },
    &ItemMetadata {
        id: 363,
        name: "TM36",
    },
    &ItemMetadata {
        id: 364,
        name: "TM37",
    },
    &ItemMetadata {
        id: 365,
        name: "TM38",
    },
    &ItemMetadata {
        id: 366,
        name: "TM39",
    },
    &ItemMetadata {
        id: 367,
        name: "TM40",
    },
    &ItemMetadata {
        id: 368,
        name: "TM41",
    },
    &ItemMetadata {
        id: 369,
        name: "TM42",
    },
    &ItemMetadata {
        id: 370,
        name: "TM43",
    },
    &ItemMetadata {
        id: 371,
        name: "TM44",
    },
    &ItemMetadata {
        id: 372,
        name: "TM45",
    },
    &ItemMetadata {
        id: 373,
        name: "TM46",
    },
    &ItemMetadata {
        id: 374,
        name: "TM47",
    },
    &ItemMetadata {
        id: 375,
        name: "TM48",
    },
    &ItemMetadata {
        id: 376,
        name: "TM49",
    },
    &ItemMetadata {
        id: 377,
        name: "TM50",
    },
    &ItemMetadata {
        id: 378,
        name: "TM51",
    },
    &ItemMetadata {
        id: 379,
        name: "TM52",
    },
    &ItemMetadata {
        id: 380,
        name: "TM53",
    },
    &ItemMetadata {
        id: 381,
        name: "TM54",
    },
    &ItemMetadata {
        id: 382,
        name: "TM55",
    },
    &ItemMetadata {
        id: 383,
        name: "TM56",
    },
    &ItemMetadata {
        id: 384,
        name: "TM57",
    },
    &ItemMetadata {
        id: 385,
        name: "TM58",
    },
    &ItemMetadata {
        id: 386,
        name: "TM59",
    },
    &ItemMetadata {
        id: 387,
        name: "TM60",
    },
    &ItemMetadata {
        id: 388,
        name: "TM61",
    },
    &ItemMetadata {
        id: 389,
        name: "TM62",
    },
    &ItemMetadata {
        id: 390,
        name: "TM63",
    },
    &ItemMetadata {
        id: 391,
        name: "TM64",
    },
    &ItemMetadata {
        id: 392,
        name: "TM65",
    },
    &ItemMetadata {
        id: 393,
        name: "TM66",
    },
    &ItemMetadata {
        id: 394,
        name: "TM67",
    },
    &ItemMetadata {
        id: 395,
        name: "TM68",
    },
    &ItemMetadata {
        id: 396,
        name: "TM69",
    },
    &ItemMetadata {
        id: 397,
        name: "TM70",
    },
    &ItemMetadata {
        id: 398,
        name: "TM71",
    },
    &ItemMetadata {
        id: 399,
        name: "TM72",
    },
    &ItemMetadata {
        id: 400,
        name: "TM73",
    },
    &ItemMetadata {
        id: 401,
        name: "TM74",
    },
    &ItemMetadata {
        id: 402,
        name: "TM75",
    },
    &ItemMetadata {
        id: 403,
        name: "TM76",
    },
    &ItemMetadata {
        id: 404,
        name: "TM77",
    },
    &ItemMetadata {
        id: 405,
        name: "TM78",
    },
    &ItemMetadata {
        id: 406,
        name: "TM79",
    },
    &ItemMetadata {
        id: 407,
        name: "TM80",
    },
    &ItemMetadata {
        id: 408,
        name: "TM81",
    },
    &ItemMetadata {
        id: 409,
        name: "TM82",
    },
    &ItemMetadata {
        id: 410,
        name: "TM83",
    },
    &ItemMetadata {
        id: 411,
        name: "TM84",
    },
    &ItemMetadata {
        id: 412,
        name: "TM85",
    },
    &ItemMetadata {
        id: 413,
        name: "TM86",
    },
    &ItemMetadata {
        id: 414,
        name: "TM87",
    },
    &ItemMetadata {
        id: 415,
        name: "TM88",
    },
    &ItemMetadata {
        id: 416,
        name: "TM89",
    },
    &ItemMetadata {
        id: 417,
        name: "TM90",
    },
    &ItemMetadata {
        id: 418,
        name: "TM91",
    },
    &ItemMetadata {
        id: 419,
        name: "TM92",
    },
    &ItemMetadata {
        id: 420,
        name: "HM01",
    },
    &ItemMetadata {
        id: 421,
        name: "HM02",
    },
    &ItemMetadata {
        id: 422,
        name: "HM03",
    },
    &ItemMetadata {
        id: 423,
        name: "HM04",
    },
    &ItemMetadata {
        id: 424,
        name: "HM05",
    },
    &ItemMetadata {
        id: 425,
        name: "HM06",
    },
    &ItemMetadata {
        id: 426,
        name: "???",
    },
    &ItemMetadata {
        id: 427,
        name: "???",
    },
    &ItemMetadata {
        id: 428,
        name: "Explorer Kit",
    },
    &ItemMetadata {
        id: 429,
        name: "Loot Sack",
    },
    &ItemMetadata {
        id: 430,
        name: "Rule Book",
    },
    &ItemMetadata {
        id: 431,
        name: "Poké Radar",
    },
    &ItemMetadata {
        id: 432,
        name: "Point Card",
    },
    &ItemMetadata {
        id: 433,
        name: "Guidebook",
    },
    &ItemMetadata {
        id: 434,
        name: "Sticker Case",
    },
    &ItemMetadata {
        id: 435,
        name: "Fashion Case",
    },
    &ItemMetadata {
        id: 436,
        name: "Sticker Bag",
    },
    &ItemMetadata {
        id: 437,
        name: "Pal Pad",
    },
    &ItemMetadata {
        id: 438,
        name: "Works Key",
    },
    &ItemMetadata {
        id: 439,
        name: "Old Charm",
    },
    &ItemMetadata {
        id: 440,
        name: "Galactic Key",
    },
    &ItemMetadata {
        id: 441,
        name: "Red Chain",
    },
    &ItemMetadata {
        id: 442,
        name: "Town Map",
    },
    &ItemMetadata {
        id: 443,
        name: "Vs. Seeker",
    },
    &ItemMetadata {
        id: 444,
        name: "Coin Case",
    },
    &ItemMetadata {
        id: 445,
        name: "Old Rod",
    },
    &ItemMetadata {
        id: 446,
        name: "Good Rod",
    },
    &ItemMetadata {
        id: 447,
        name: "Super Rod",
    },
    &ItemMetadata {
        id: 448,
        name: "Sprayduck",
    },
    &ItemMetadata {
        id: 449,
        name: "Poffin Case",
    },
    &ItemMetadata {
        id: 450,
        name: "Bike",
    },
    &ItemMetadata {
        id: 451,
        name: "Suite Key",
    },
    &ItemMetadata {
        id: 452,
        name: "Oak’s Letter",
    },
    &ItemMetadata {
        id: 453,
        name: "Lunar Feather",
    },
    &ItemMetadata {
        id: 454,
        name: "Member Card",
    },
    &ItemMetadata {
        id: 455,
        name: "Azure Flute",
    },
    &ItemMetadata {
        id: 456,
        name: "S.S. Ticket",
    },
    &ItemMetadata {
        id: 457,
        name: "Contest Pass",
    },
    &ItemMetadata {
        id: 458,
        name: "Magma Stone",
    },
    &ItemMetadata {
        id: 459,
        name: "Parcel",
    },
    &ItemMetadata {
        id: 460,
        name: "Coupon 1",
    },
    &ItemMetadata {
        id: 461,
        name: "Coupon 2",
    },
    &ItemMetadata {
        id: 462,
        name: "Coupon 3",
    },
    &ItemMetadata {
        id: 463,
        name: "Storage Key",
    },
    &ItemMetadata {
        id: 464,
        name: "Secret Medicine",
    },
    &ItemMetadata {
        id: 465,
        name: "Vs. Recorder",
    },
    &ItemMetadata {
        id: 466,
        name: "Gracidea",
    },
    &ItemMetadata {
        id: 467,
        name: "Secret Key",
    },
    &ItemMetadata {
        id: 468,
        name: "Apricorn Box",
    },
    &ItemMetadata {
        id: 469,
        name: "Unown Report",
    },
    &ItemMetadata {
        id: 470,
        name: "Berry Pots",
    },
    &ItemMetadata {
        id: 471,
        name: "Dowsing Machine",
    },
    &ItemMetadata {
        id: 472,
        name: "Blue Card",
    },
    &ItemMetadata {
        id: 473,
        name: "Slowpoke Tail",
    },
    &ItemMetadata {
        id: 474,
        name: "Clear Bell",
    },
    &ItemMetadata {
        id: 475,
        name: "Card Key",
    },
    &ItemMetadata {
        id: 476,
        name: "Basement Key",
    },
    &ItemMetadata {
        id: 477,
        name: "Squirt Bottle",
    },
    &ItemMetadata {
        id: 478,
        name: "Red Scale",
    },
    &ItemMetadata {
        id: 479,
        name: "Lost Item",
    },
    &ItemMetadata {
        id: 480,
        name: "Pass",
    },
    &ItemMetadata {
        id: 481,
        name: "Machine Part",
    },
    &ItemMetadata {
        id: 482,
        name: "Silver Feather",
    },
    &ItemMetadata {
        id: 483,
        name: "Rainbow Feather",
    },
    &ItemMetadata {
        id: 484,
        name: "Mystery Egg",
    },
    &ItemMetadata {
        id: 485,
        name: "Red Apricorn",
    },
    &ItemMetadata {
        id: 486,
        name: "Blue Apricorn",
    },
    &ItemMetadata {
        id: 487,
        name: "Yellow Apricorn",
    },
    &ItemMetadata {
        id: 488,
        name: "Green Apricorn",
    },
    &ItemMetadata {
        id: 489,
        name: "Pink Apricorn",
    },
    &ItemMetadata {
        id: 490,
        name: "White Apricorn",
    },
    &ItemMetadata {
        id: 491,
        name: "Black Apricorn",
    },
    &ItemMetadata {
        id: 492,
        name: "Fast Ball",
    },
    &ItemMetadata {
        id: 493,
        name: "Level Ball",
    },
    &ItemMetadata {
        id: 494,
        name: "Lure Ball",
    },
    &ItemMetadata {
        id: 495,
        name: "Heavy Ball",
    },
    &ItemMetadata {
        id: 496,
        name: "Love Ball",
    },
    &ItemMetadata {
        id: 497,
        name: "Friend Ball",
    },
    &ItemMetadata {
        id: 498,
        name: "Moon Ball",
    },
    &ItemMetadata {
        id: 499,
        name: "Sport Ball",
    },
    &ItemMetadata {
        id: 500,
        name: "Park Ball",
    },
    &ItemMetadata {
        id: 501,
        name: "Photo Album",
    },
    &ItemMetadata {
        id: 502,
        name: "GB Sounds",
    },
    &ItemMetadata {
        id: 503,
        name: "Tidal Bell",
    },
    &ItemMetadata {
        id: 504,
        name: "Rage Candy Bar",
    },
    &ItemMetadata {
        id: 505,
        name: "Data Card 01",
    },
    &ItemMetadata {
        id: 506,
        name: "Data Card 02",
    },
    &ItemMetadata {
        id: 507,
        name: "Data Card 03",
    },
    &ItemMetadata {
        id: 508,
        name: "Data Card 04",
    },
    &ItemMetadata {
        id: 509,
        name: "Data Card 05",
    },
    &ItemMetadata {
        id: 510,
        name: "Data Card 06",
    },
    &ItemMetadata {
        id: 511,
        name: "Data Card 07",
    },
    &ItemMetadata {
        id: 512,
        name: "Data Card 08",
    },
    &ItemMetadata {
        id: 513,
        name: "Data Card 09",
    },
    &ItemMetadata {
        id: 514,
        name: "Data Card 10",
    },
    &ItemMetadata {
        id: 515,
        name: "Data Card 11",
    },
    &ItemMetadata {
        id: 516,
        name: "Data Card 12",
    },
    &ItemMetadata {
        id: 517,
        name: "Data Card 13",
    },
    &ItemMetadata {
        id: 518,
        name: "Data Card 14",
    },
    &ItemMetadata {
        id: 519,
        name: "Data Card 15",
    },
    &ItemMetadata {
        id: 520,
        name: "Data Card 16",
    },
    &ItemMetadata {
        id: 521,
        name: "Data Card 17",
    },
    &ItemMetadata {
        id: 522,
        name: "Data Card 18",
    },
    &ItemMetadata {
        id: 523,
        name: "Data Card 19",
    },
    &ItemMetadata {
        id: 524,
        name: "Data Card 20",
    },
    &ItemMetadata {
        id: 525,
        name: "Data Card 21",
    },
    &ItemMetadata {
        id: 526,
        name: "Data Card 22",
    },
    &ItemMetadata {
        id: 527,
        name: "Data Card 23",
    },
    &ItemMetadata {
        id: 528,
        name: "Data Card 24",
    },
    &ItemMetadata {
        id: 529,
        name: "Data Card 25",
    },
    &ItemMetadata {
        id: 530,
        name: "Data Card 26",
    },
    &ItemMetadata {
        id: 531,
        name: "Data Card 27",
    },
    &ItemMetadata {
        id: 532,
        name: "Jade Orb",
    },
    &ItemMetadata {
        id: 533,
        name: "Lock Capsule",
    },
    &ItemMetadata {
        id: 534,
        name: "Red Orb",
    },
    &ItemMetadata {
        id: 535,
        name: "Blue Orb",
    },
    &ItemMetadata {
        id: 536,
        name: "Enigma Stone",
    },
    &ItemMetadata {
        id: 537,
        name: "Prism Scale",
    },
    &ItemMetadata {
        id: 538,
        name: "Eviolite",
    },
    &ItemMetadata {
        id: 539,
        name: "Float Stone",
    },
    &ItemMetadata {
        id: 540,
        name: "Rocky Helmet",
    },
    &ItemMetadata {
        id: 541,
        name: "Air Balloon",
    },
    &ItemMetadata {
        id: 542,
        name: "Red Card",
    },
    &ItemMetadata {
        id: 543,
        name: "Ring Target",
    },
    &ItemMetadata {
        id: 544,
        name: "Binding Band",
    },
    &ItemMetadata {
        id: 545,
        name: "Absorb Bulb",
    },
    &ItemMetadata {
        id: 546,
        name: "Cell Battery",
    },
    &ItemMetadata {
        id: 547,
        name: "Eject Button",
    },
    &ItemMetadata {
        id: 548,
        name: "Fire Gem",
    },
    &ItemMetadata {
        id: 549,
        name: "Water Gem",
    },
    &ItemMetadata {
        id: 550,
        name: "Electric Gem",
    },
    &ItemMetadata {
        id: 551,
        name: "Grass Gem",
    },
    &ItemMetadata {
        id: 552,
        name: "Ice Gem",
    },
    &ItemMetadata {
        id: 553,
        name: "Fighting Gem",
    },
    &ItemMetadata {
        id: 554,
        name: "Poison Gem",
    },
    &ItemMetadata {
        id: 555,
        name: "Ground Gem",
    },
    &ItemMetadata {
        id: 556,
        name: "Flying Gem",
    },
    &ItemMetadata {
        id: 557,
        name: "Psychic Gem",
    },
    &ItemMetadata {
        id: 558,
        name: "Bug Gem",
    },
    &ItemMetadata {
        id: 559,
        name: "Rock Gem",
    },
    &ItemMetadata {
        id: 560,
        name: "Ghost Gem",
    },
    &ItemMetadata {
        id: 561,
        name: "Dragon Gem",
    },
    &ItemMetadata {
        id: 562,
        name: "Dark Gem",
    },
    &ItemMetadata {
        id: 563,
        name: "Steel Gem",
    },
    &ItemMetadata {
        id: 564,
        name: "Normal Gem",
    },
    &ItemMetadata {
        id: 565,
        name: "Health Feather",
    },
    &ItemMetadata {
        id: 566,
        name: "Muscle Feather",
    },
    &ItemMetadata {
        id: 567,
        name: "Resist Feather",
    },
    &ItemMetadata {
        id: 568,
        name: "Genius Feather",
    },
    &ItemMetadata {
        id: 569,
        name: "Clever Feather",
    },
    &ItemMetadata {
        id: 570,
        name: "Swift Feather",
    },
    &ItemMetadata {
        id: 571,
        name: "Pretty Feather",
    },
    &ItemMetadata {
        id: 572,
        name: "Cover Fossil",
    },
    &ItemMetadata {
        id: 573,
        name: "Plume Fossil",
    },
    &ItemMetadata {
        id: 574,
        name: "Liberty Pass",
    },
    &ItemMetadata {
        id: 575,
        name: "Pass Orb",
    },
    &ItemMetadata {
        id: 576,
        name: "Dream Ball",
    },
    &ItemMetadata {
        id: 577,
        name: "Poké Toy",
    },
    &ItemMetadata {
        id: 578,
        name: "Prop Case",
    },
    &ItemMetadata {
        id: 579,
        name: "Dragon Skull",
    },
    &ItemMetadata {
        id: 580,
        name: "Balm Mushroom",
    },
    &ItemMetadata {
        id: 581,
        name: "Big Nugget",
    },
    &ItemMetadata {
        id: 582,
        name: "Pearl String",
    },
    &ItemMetadata {
        id: 583,
        name: "Comet Shard",
    },
    &ItemMetadata {
        id: 584,
        name: "Relic Copper",
    },
    &ItemMetadata {
        id: 585,
        name: "Relic Silver",
    },
    &ItemMetadata {
        id: 586,
        name: "Relic Gold",
    },
    &ItemMetadata {
        id: 587,
        name: "Relic Vase",
    },
    &ItemMetadata {
        id: 588,
        name: "Relic Band",
    },
    &ItemMetadata {
        id: 589,
        name: "Relic Statue",
    },
    &ItemMetadata {
        id: 590,
        name: "Relic Crown",
    },
    &ItemMetadata {
        id: 591,
        name: "Casteliacone",
    },
    &ItemMetadata {
        id: 592,
        name: "Dire Hit 2",
    },
    &ItemMetadata {
        id: 593,
        name: "X Speed 2",
    },
    &ItemMetadata {
        id: 594,
        name: "X Sp. Atk 2",
    },
    &ItemMetadata {
        id: 595,
        name: "X Sp. Def 2",
    },
    &ItemMetadata {
        id: 596,
        name: "X Defense 2",
    },
    &ItemMetadata {
        id: 597,
        name: "X Attack 2",
    },
    &ItemMetadata {
        id: 598,
        name: "X Accuracy 2",
    },
    &ItemMetadata {
        id: 599,
        name: "X Speed 3",
    },
    &ItemMetadata {
        id: 600,
        name: "X Sp. Atk 3",
    },
    &ItemMetadata {
        id: 601,
        name: "X Sp. Def 3",
    },
    &ItemMetadata {
        id: 602,
        name: "X Defense 3",
    },
    &ItemMetadata {
        id: 603,
        name: "X Attack 3",
    },
    &ItemMetadata {
        id: 604,
        name: "X Accuracy 3",
    },
    &ItemMetadata {
        id: 605,
        name: "X Speed 6",
    },
    &ItemMetadata {
        id: 606,
        name: "X Sp. Atk 6",
    },
    &ItemMetadata {
        id: 607,
        name: "X Sp. Def 6",
    },
    &ItemMetadata {
        id: 608,
        name: "X Defense 6",
    },
    &ItemMetadata {
        id: 609,
        name: "X Attack 6",
    },
    &ItemMetadata {
        id: 610,
        name: "X Accuracy 6",
    },
    &ItemMetadata {
        id: 611,
        name: "Ability Urge",
    },
    &ItemMetadata {
        id: 612,
        name: "Item Drop",
    },
    &ItemMetadata {
        id: 613,
        name: "Item Urge",
    },
    &ItemMetadata {
        id: 614,
        name: "Reset Urge",
    },
    &ItemMetadata {
        id: 615,
        name: "Dire Hit 3",
    },
    &ItemMetadata {
        id: 616,
        name: "Light Stone",
    },
    &ItemMetadata {
        id: 617,
        name: "Dark Stone",
    },
    &ItemMetadata {
        id: 618,
        name: "TM93",
    },
    &ItemMetadata {
        id: 619,
        name: "TM94",
    },
    &ItemMetadata {
        id: 620,
        name: "TM95",
    },
    &ItemMetadata {
        id: 621,
        name: "Xtransceiver",
    },
    &ItemMetadata {
        id: 622,
        name: "???",
    },
    &ItemMetadata {
        id: 623,
        name: "Gram 1",
    },
    &ItemMetadata {
        id: 624,
        name: "Gram 2",
    },
    &ItemMetadata {
        id: 625,
        name: "Gram 3",
    },
    &ItemMetadata {
        id: 626,
        name: "Xtransceiver",
    },
    &ItemMetadata {
        id: 627,
        name: "Medal Box",
    },
    &ItemMetadata {
        id: 628,
        name: "DNA Splicers",
    },
    &ItemMetadata {
        id: 629,
        name: "DNA Splicers",
    },
    &ItemMetadata {
        id: 630,
        name: "Permit",
    },
    &ItemMetadata {
        id: 631,
        name: "Oval Charm",
    },
    &ItemMetadata {
        id: 632,
        name: "Shiny Charm",
    },
    &ItemMetadata {
        id: 633,
        name: "Plasma Card",
    },
    &ItemMetadata {
        id: 634,
        name: "Grubby Hanky",
    },
    &ItemMetadata {
        id: 635,
        name: "Colress Machine",
    },
    &ItemMetadata {
        id: 636,
        name: "Dropped Item",
    },
    &ItemMetadata {
        id: 637,
        name: "Dropped Item",
    },
    &ItemMetadata {
        id: 638,
        name: "Reveal Glass",
    },
    &ItemMetadata {
        id: 639,
        name: "Weakness Policy",
    },
    &ItemMetadata {
        id: 640,
        name: "Assault Vest",
    },
    &ItemMetadata {
        id: 641,
        name: "Holo Caster",
    },
    &ItemMetadata {
        id: 642,
        name: "Prof’s Letter",
    },
    &ItemMetadata {
        id: 643,
        name: "Roller Skates",
    },
    &ItemMetadata {
        id: 644,
        name: "Pixie Plate",
    },
    &ItemMetadata {
        id: 645,
        name: "Ability Capsule",
    },
    &ItemMetadata {
        id: 646,
        name: "Whipped Dream",
    },
    &ItemMetadata {
        id: 647,
        name: "Sachet",
    },
    &ItemMetadata {
        id: 648,
        name: "Luminous Moss",
    },
    &ItemMetadata {
        id: 649,
        name: "Snowball",
    },
    &ItemMetadata {
        id: 650,
        name: "Safety Goggles",
    },
    &ItemMetadata {
        id: 651,
        name: "Poké Flute",
    },
    &ItemMetadata {
        id: 652,
        name: "Rich Mulch",
    },
    &ItemMetadata {
        id: 653,
        name: "Surprise Mulch",
    },
    &ItemMetadata {
        id: 654,
        name: "Boost Mulch",
    },
    &ItemMetadata {
        id: 655,
        name: "Amaze Mulch",
    },
    &ItemMetadata {
        id: 656,
        name: "Gengarite",
    },
    &ItemMetadata {
        id: 657,
        name: "Gardevoirite",
    },
    &ItemMetadata {
        id: 658,
        name: "Ampharosite",
    },
    &ItemMetadata {
        id: 659,
        name: "Venusaurite",
    },
    &ItemMetadata {
        id: 660,
        name: "Charizardite X",
    },
    &ItemMetadata {
        id: 661,
        name: "Blastoisinite",
    },
    &ItemMetadata {
        id: 662,
        name: "Mewtwonite X",
    },
    &ItemMetadata {
        id: 663,
        name: "Mewtwonite Y",
    },
    &ItemMetadata {
        id: 664,
        name: "Blazikenite",
    },
    &ItemMetadata {
        id: 665,
        name: "Medichamite",
    },
    &ItemMetadata {
        id: 666,
        name: "Houndoominite",
    },
    &ItemMetadata {
        id: 667,
        name: "Aggronite",
    },
    &ItemMetadata {
        id: 668,
        name: "Banettite",
    },
    &ItemMetadata {
        id: 669,
        name: "Tyranitarite",
    },
    &ItemMetadata {
        id: 670,
        name: "Scizorite",
    },
    &ItemMetadata {
        id: 671,
        name: "Pinsirite",
    },
    &ItemMetadata {
        id: 672,
        name: "Aerodactylite",
    },
    &ItemMetadata {
        id: 673,
        name: "Lucarionite",
    },
    &ItemMetadata {
        id: 674,
        name: "Abomasite",
    },
    &ItemMetadata {
        id: 675,
        name: "Kangaskhanite",
    },
    &ItemMetadata {
        id: 676,
        name: "Gyaradosite",
    },
    &ItemMetadata {
        id: 677,
        name: "Absolite",
    },
    &ItemMetadata {
        id: 678,
        name: "Charizardite Y",
    },
    &ItemMetadata {
        id: 679,
        name: "Alakazite",
    },
    &ItemMetadata {
        id: 680,
        name: "Heracronite",
    },
    &ItemMetadata {
        id: 681,
        name: "Mawilite",
    },
    &ItemMetadata {
        id: 682,
        name: "Manectite",
    },
    &ItemMetadata {
        id: 683,
        name: "Garchompite",
    },
    &ItemMetadata {
        id: 684,
        name: "Latiasite",
    },
    &ItemMetadata {
        id: 685,
        name: "Latiosite",
    },
    &ItemMetadata {
        id: 686,
        name: "Roseli Berry",
    },
    &ItemMetadata {
        id: 687,
        name: "Kee Berry",
    },
    &ItemMetadata {
        id: 688,
        name: "Maranga Berry",
    },
    &ItemMetadata {
        id: 689,
        name: "Sprinklotad",
    },
    &ItemMetadata {
        id: 690,
        name: "TM96",
    },
    &ItemMetadata {
        id: 691,
        name: "TM97",
    },
    &ItemMetadata {
        id: 692,
        name: "TM98",
    },
    &ItemMetadata {
        id: 693,
        name: "TM99",
    },
    &ItemMetadata {
        id: 694,
        name: "TM100",
    },
    &ItemMetadata {
        id: 695,
        name: "Power Plant Pass",
    },
    &ItemMetadata {
        id: 696,
        name: "Mega Ring",
    },
    &ItemMetadata {
        id: 697,
        name: "Intriguing Stone",
    },
    &ItemMetadata {
        id: 698,
        name: "Common Stone",
    },
    &ItemMetadata {
        id: 699,
        name: "Discount Coupon",
    },
    &ItemMetadata {
        id: 700,
        name: "Elevator Key",
    },
    &ItemMetadata {
        id: 701,
        name: "TMV Pass",
    },
    &ItemMetadata {
        id: 702,
        name: "Honor of Kalos",
    },
    &ItemMetadata {
        id: 703,
        name: "Adventure Guide",
    },
    &ItemMetadata {
        id: 704,
        name: "Strange Souvenir",
    },
    &ItemMetadata {
        id: 705,
        name: "Lens Case",
    },
    &ItemMetadata {
        id: 706,
        name: "Makeup Bag",
    },
    &ItemMetadata {
        id: 707,
        name: "Travel Trunk",
    },
    &ItemMetadata {
        id: 708,
        name: "Lumiose Galette",
    },
    &ItemMetadata {
        id: 709,
        name: "Shalour Sable",
    },
    &ItemMetadata {
        id: 710,
        name: "Jaw Fossil",
    },
    &ItemMetadata {
        id: 711,
        name: "Sail Fossil",
    },
    &ItemMetadata {
        id: 712,
        name: "Looker Ticket",
    },
    &ItemMetadata {
        id: 713,
        name: "Bike",
    },
    &ItemMetadata {
        id: 714,
        name: "Holo Caster",
    },
    &ItemMetadata {
        id: 715,
        name: "Fairy Gem",
    },
    &ItemMetadata {
        id: 716,
        name: "Mega Charm",
    },
    &ItemMetadata {
        id: 717,
        name: "Mega Glove",
    },
    &ItemMetadata {
        id: 718,
        name: "Mach Bike",
    },
    &ItemMetadata {
        id: 719,
        name: "Acro Bike",
    },
    &ItemMetadata {
        id: 720,
        name: "Wailmer Pail",
    },
    &ItemMetadata {
        id: 721,
        name: "Devon Parts",
    },
    &ItemMetadata {
        id: 722,
        name: "Soot Sack",
    },
    &ItemMetadata {
        id: 723,
        name: "Basement Key",
    },
    &ItemMetadata {
        id: 724,
        name: "Pokéblock Kit",
    },
    &ItemMetadata {
        id: 725,
        name: "Letter",
    },
    &ItemMetadata {
        id: 726,
        name: "Eon Ticket",
    },
    &ItemMetadata {
        id: 727,
        name: "Scanner",
    },
    &ItemMetadata {
        id: 728,
        name: "Go-Goggles",
    },
    &ItemMetadata {
        id: 729,
        name: "Meteorite",
    },
    &ItemMetadata {
        id: 730,
        name: "Key to Room 1",
    },
    &ItemMetadata {
        id: 731,
        name: "Key to Room 2",
    },
    &ItemMetadata {
        id: 732,
        name: "Key to Room 4",
    },
    &ItemMetadata {
        id: 733,
        name: "Key to Room 6",
    },
    &ItemMetadata {
        id: 734,
        name: "Storage Key",
    },
    &ItemMetadata {
        id: 735,
        name: "Devon Scope",
    },
    &ItemMetadata {
        id: 736,
        name: "S.S. Ticket",
    },
    &ItemMetadata {
        id: 737,
        name: "HM07",
    },
    &ItemMetadata {
        id: 738,
        name: "Devon Scuba Gear",
    },
    &ItemMetadata {
        id: 739,
        name: "Contest Costume",
    },
    &ItemMetadata {
        id: 740,
        name: "Contest Costume",
    },
    &ItemMetadata {
        id: 741,
        name: "Magma Suit",
    },
    &ItemMetadata {
        id: 742,
        name: "Aqua Suit",
    },
    &ItemMetadata {
        id: 743,
        name: "Pair of Tickets",
    },
    &ItemMetadata {
        id: 744,
        name: "Mega Bracelet",
    },
    &ItemMetadata {
        id: 745,
        name: "Mega Pendant",
    },
    &ItemMetadata {
        id: 746,
        name: "Mega Glasses",
    },
    &ItemMetadata {
        id: 747,
        name: "Mega Anchor",
    },
    &ItemMetadata {
        id: 748,
        name: "Mega Stickpin",
    },
    &ItemMetadata {
        id: 749,
        name: "Mega Tiara",
    },
    &ItemMetadata {
        id: 750,
        name: "Mega Anklet",
    },
    &ItemMetadata {
        id: 751,
        name: "Meteorite",
    },
    &ItemMetadata {
        id: 752,
        name: "Swampertite",
    },
    &ItemMetadata {
        id: 753,
        name: "Sceptilite",
    },
    &ItemMetadata {
        id: 754,
        name: "Sablenite",
    },
    &ItemMetadata {
        id: 755,
        name: "Altarianite",
    },
    &ItemMetadata {
        id: 756,
        name: "Galladite",
    },
    &ItemMetadata {
        id: 757,
        name: "Audinite",
    },
    &ItemMetadata {
        id: 758,
        name: "Metagrossite",
    },
    &ItemMetadata {
        id: 759,
        name: "Sharpedonite",
    },
    &ItemMetadata {
        id: 760,
        name: "Slowbronite",
    },
    &ItemMetadata {
        id: 761,
        name: "Steelixite",
    },
    &ItemMetadata {
        id: 762,
        name: "Pidgeotite",
    },
    &ItemMetadata {
        id: 763,
        name: "Glalitite",
    },
    &ItemMetadata {
        id: 764,
        name: "Diancite",
    },
    &ItemMetadata {
        id: 765,
        name: "Prison Bottle",
    },
    &ItemMetadata {
        id: 766,
        name: "Mega Cuff",
    },
    &ItemMetadata {
        id: 767,
        name: "Cameruptite",
    },
    &ItemMetadata {
        id: 768,
        name: "Lopunnite",
    },
    &ItemMetadata {
        id: 769,
        name: "Salamencite",
    },
    &ItemMetadata {
        id: 770,
        name: "Beedrillite",
    },
    &ItemMetadata {
        id: 771,
        name: "Meteorite",
    },
    &ItemMetadata {
        id: 772,
        name: "Meteorite",
    },
    &ItemMetadata {
        id: 773,
        name: "Key Stone",
    },
    &ItemMetadata {
        id: 774,
        name: "Meteorite Shard",
    },
    &ItemMetadata {
        id: 775,
        name: "Eon Flute",
    },
    &ItemMetadata {
        id: 776,
        name: "Normalium Z",
    },
    &ItemMetadata {
        id: 777,
        name: "Firium Z",
    },
    &ItemMetadata {
        id: 778,
        name: "Waterium Z",
    },
    &ItemMetadata {
        id: 779,
        name: "Electrium Z",
    },
    &ItemMetadata {
        id: 780,
        name: "Grassium Z",
    },
    &ItemMetadata {
        id: 781,
        name: "Icium Z",
    },
    &ItemMetadata {
        id: 782,
        name: "Fightinium Z",
    },
    &ItemMetadata {
        id: 783,
        name: "Poisonium Z",
    },
    &ItemMetadata {
        id: 784,
        name: "Groundium Z",
    },
    &ItemMetadata {
        id: 785,
        name: "Flyinium Z",
    },
    &ItemMetadata {
        id: 786,
        name: "Psychium Z",
    },
    &ItemMetadata {
        id: 787,
        name: "Buginium Z",
    },
    &ItemMetadata {
        id: 788,
        name: "Rockium Z",
    },
    &ItemMetadata {
        id: 789,
        name: "Ghostium Z",
    },
    &ItemMetadata {
        id: 790,
        name: "Dragonium Z",
    },
    &ItemMetadata {
        id: 791,
        name: "Darkinium Z",
    },
    &ItemMetadata {
        id: 792,
        name: "Steelium Z",
    },
    &ItemMetadata {
        id: 793,
        name: "Fairium Z",
    },
    &ItemMetadata {
        id: 794,
        name: "Pikanium Z",
    },
    &ItemMetadata {
        id: 795,
        name: "Bottle Cap",
    },
    &ItemMetadata {
        id: 796,
        name: "Gold Bottle Cap",
    },
    &ItemMetadata {
        id: 797,
        name: "Z-Ring",
    },
    &ItemMetadata {
        id: 798,
        name: "Decidium Z",
    },
    &ItemMetadata {
        id: 799,
        name: "Incinium Z",
    },
    &ItemMetadata {
        id: 800,
        name: "Primarium Z",
    },
    &ItemMetadata {
        id: 801,
        name: "Tapunium Z",
    },
    &ItemMetadata {
        id: 802,
        name: "Marshadium Z",
    },
    &ItemMetadata {
        id: 803,
        name: "Aloraichium Z",
    },
    &ItemMetadata {
        id: 804,
        name: "Snorlium Z",
    },
    &ItemMetadata {
        id: 805,
        name: "Eevium Z",
    },
    &ItemMetadata {
        id: 806,
        name: "Mewnium Z",
    },
    &ItemMetadata {
        id: 807,
        name: "Normalium Z",
    },
    &ItemMetadata {
        id: 808,
        name: "Firium Z",
    },
    &ItemMetadata {
        id: 809,
        name: "Waterium Z",
    },
    &ItemMetadata {
        id: 810,
        name: "Electrium Z",
    },
    &ItemMetadata {
        id: 811,
        name: "Grassium Z",
    },
    &ItemMetadata {
        id: 812,
        name: "Icium Z",
    },
    &ItemMetadata {
        id: 813,
        name: "Fightinium Z",
    },
    &ItemMetadata {
        id: 814,
        name: "Poisonium Z",
    },
    &ItemMetadata {
        id: 815,
        name: "Groundium Z",
    },
    &ItemMetadata {
        id: 816,
        name: "Flyinium Z",
    },
    &ItemMetadata {
        id: 817,
        name: "Psychium Z",
    },
    &ItemMetadata {
        id: 818,
        name: "Buginium Z",
    },
    &ItemMetadata {
        id: 819,
        name: "Rockium Z",
    },
    &ItemMetadata {
        id: 820,
        name: "Ghostium Z",
    },
    &ItemMetadata {
        id: 821,
        name: "Dragonium Z",
    },
    &ItemMetadata {
        id: 822,
        name: "Darkinium Z",
    },
    &ItemMetadata {
        id: 823,
        name: "Steelium Z",
    },
    &ItemMetadata {
        id: 824,
        name: "Fairium Z",
    },
    &ItemMetadata {
        id: 825,
        name: "Pikanium Z",
    },
    &ItemMetadata {
        id: 826,
        name: "Decidium Z",
    },
    &ItemMetadata {
        id: 827,
        name: "Incinium Z",
    },
    &ItemMetadata {
        id: 828,
        name: "Primarium Z",
    },
    &ItemMetadata {
        id: 829,
        name: "Tapunium Z",
    },
    &ItemMetadata {
        id: 830,
        name: "Marshadium Z",
    },
    &ItemMetadata {
        id: 831,
        name: "Aloraichium Z",
    },
    &ItemMetadata {
        id: 832,
        name: "Snorlium Z",
    },
    &ItemMetadata {
        id: 833,
        name: "Eevium Z",
    },
    &ItemMetadata {
        id: 834,
        name: "Mewnium Z",
    },
    &ItemMetadata {
        id: 835,
        name: "Pikashunium Z",
    },
    &ItemMetadata {
        id: 836,
        name: "Pikashunium Z",
    },
    &ItemMetadata {
        id: 837,
        name: "???",
    },
    &ItemMetadata {
        id: 838,
        name: "???",
    },
    &ItemMetadata {
        id: 839,
        name: "???",
    },
    &ItemMetadata {
        id: 840,
        name: "???",
    },
    &ItemMetadata {
        id: 841,
        name: "Forage Bag",
    },
    &ItemMetadata {
        id: 842,
        name: "Fishing Rod",
    },
    &ItemMetadata {
        id: 843,
        name: "Professor’s Mask",
    },
    &ItemMetadata {
        id: 844,
        name: "Festival Ticket",
    },
    &ItemMetadata {
        id: 845,
        name: "Sparkling Stone",
    },
    &ItemMetadata {
        id: 846,
        name: "Adrenaline Orb",
    },
    &ItemMetadata {
        id: 847,
        name: "Zygarde Cube",
    },
    &ItemMetadata {
        id: 848,
        name: "???",
    },
    &ItemMetadata {
        id: 849,
        name: "Ice Stone",
    },
    &ItemMetadata {
        id: 850,
        name: "Ride Pager",
    },
    &ItemMetadata {
        id: 851,
        name: "Beast Ball",
    },
    &ItemMetadata {
        id: 852,
        name: "Big Malasada",
    },
    &ItemMetadata {
        id: 853,
        name: "Red Nectar",
    },
    &ItemMetadata {
        id: 854,
        name: "Yellow Nectar",
    },
    &ItemMetadata {
        id: 855,
        name: "Pink Nectar",
    },
    &ItemMetadata {
        id: 856,
        name: "Purple Nectar",
    },
    &ItemMetadata {
        id: 857,
        name: "Sun Flute",
    },
    &ItemMetadata {
        id: 858,
        name: "Moon Flute",
    },
    &ItemMetadata {
        id: 859,
        name: "???",
    },
    &ItemMetadata {
        id: 860,
        name: "Enigmatic Card",
    },
    &ItemMetadata {
        id: 861,
        name: "Silver Razz Berry",
    },
    &ItemMetadata {
        id: 862,
        name: "Golden Razz Berry",
    },
    &ItemMetadata {
        id: 863,
        name: "Silver Nanab Berry",
    },
    &ItemMetadata {
        id: 864,
        name: "Golden Nanab Berry",
    },
    &ItemMetadata {
        id: 865,
        name: "Silver Pinap Berry",
    },
    &ItemMetadata {
        id: 866,
        name: "Golden Pinap Berry",
    },
    &ItemMetadata {
        id: 867,
        name: "???",
    },
    &ItemMetadata {
        id: 868,
        name: "???",
    },
    &ItemMetadata {
        id: 869,
        name: "???",
    },
    &ItemMetadata {
        id: 870,
        name: "???",
    },
    &ItemMetadata {
        id: 871,
        name: "???",
    },
    &ItemMetadata {
        id: 872,
        name: "Secret Key",
    },
    &ItemMetadata {
        id: 873,
        name: "S.S. Ticket",
    },
    &ItemMetadata {
        id: 874,
        name: "Silph Scope",
    },
    &ItemMetadata {
        id: 875,
        name: "Parcel",
    },
    &ItemMetadata {
        id: 876,
        name: "Card Key",
    },
    &ItemMetadata {
        id: 877,
        name: "Gold Teeth",
    },
    &ItemMetadata {
        id: 878,
        name: "Lift Key",
    },
    &ItemMetadata {
        id: 879,
        name: "Terrain Extender",
    },
    &ItemMetadata {
        id: 880,
        name: "Protective Pads",
    },
    &ItemMetadata {
        id: 881,
        name: "Electric Seed",
    },
    &ItemMetadata {
        id: 882,
        name: "Psychic Seed",
    },
    &ItemMetadata {
        id: 883,
        name: "Misty Seed",
    },
    &ItemMetadata {
        id: 884,
        name: "Grassy Seed",
    },
    &ItemMetadata {
        id: 885,
        name: "Stretchy Spring",
    },
    &ItemMetadata {
        id: 886,
        name: "Chalky Stone",
    },
    &ItemMetadata {
        id: 887,
        name: "Marble",
    },
    &ItemMetadata {
        id: 888,
        name: "Lone Earring",
    },
    &ItemMetadata {
        id: 889,
        name: "Beach Glass",
    },
    &ItemMetadata {
        id: 890,
        name: "Gold Leaf",
    },
    &ItemMetadata {
        id: 891,
        name: "Silver Leaf",
    },
    &ItemMetadata {
        id: 892,
        name: "Polished Mud Ball",
    },
    &ItemMetadata {
        id: 893,
        name: "Tropical Shell",
    },
    &ItemMetadata {
        id: 894,
        name: "Leaf Letter",
    },
    &ItemMetadata {
        id: 895,
        name: "Leaf Letter",
    },
    &ItemMetadata {
        id: 896,
        name: "Small Bouquet",
    },
    &ItemMetadata {
        id: 897,
        name: "???",
    },
    &ItemMetadata {
        id: 898,
        name: "???",
    },
    &ItemMetadata {
        id: 899,
        name: "???",
    },
    &ItemMetadata {
        id: 900,
        name: "Lure",
    },
    &ItemMetadata {
        id: 901,
        name: "Super Lure",
    },
    &ItemMetadata {
        id: 902,
        name: "Max Lure",
    },
    &ItemMetadata {
        id: 903,
        name: "Pewter Crunchies",
    },
    &ItemMetadata {
        id: 904,
        name: "Fighting Memory",
    },
    &ItemMetadata {
        id: 905,
        name: "Flying Memory",
    },
    &ItemMetadata {
        id: 906,
        name: "Poison Memory",
    },
    &ItemMetadata {
        id: 907,
        name: "Ground Memory",
    },
    &ItemMetadata {
        id: 908,
        name: "Rock Memory",
    },
    &ItemMetadata {
        id: 909,
        name: "Bug Memory",
    },
    &ItemMetadata {
        id: 910,
        name: "Ghost Memory",
    },
    &ItemMetadata {
        id: 911,
        name: "Steel Memory",
    },
    &ItemMetadata {
        id: 912,
        name: "Fire Memory",
    },
    &ItemMetadata {
        id: 913,
        name: "Water Memory",
    },
    &ItemMetadata {
        id: 914,
        name: "Grass Memory",
    },
    &ItemMetadata {
        id: 915,
        name: "Electric Memory",
    },
    &ItemMetadata {
        id: 916,
        name: "Psychic Memory",
    },
    &ItemMetadata {
        id: 917,
        name: "Ice Memory",
    },
    &ItemMetadata {
        id: 918,
        name: "Dragon Memory",
    },
    &ItemMetadata {
        id: 919,
        name: "Dark Memory",
    },
    &ItemMetadata {
        id: 920,
        name: "Fairy Memory",
    },
    &ItemMetadata {
        id: 921,
        name: "Solganium Z",
    },
    &ItemMetadata {
        id: 922,
        name: "Lunalium Z",
    },
    &ItemMetadata {
        id: 923,
        name: "Ultranecrozium Z",
    },
    &ItemMetadata {
        id: 924,
        name: "Mimikium Z",
    },
    &ItemMetadata {
        id: 925,
        name: "Lycanium Z",
    },
    &ItemMetadata {
        id: 926,
        name: "Kommonium Z",
    },
    &ItemMetadata {
        id: 927,
        name: "Solganium Z",
    },
    &ItemMetadata {
        id: 928,
        name: "Lunalium Z",
    },
    &ItemMetadata {
        id: 929,
        name: "Ultranecrozium Z",
    },
    &ItemMetadata {
        id: 930,
        name: "Mimikium Z",
    },
    &ItemMetadata {
        id: 931,
        name: "Lycanium Z",
    },
    &ItemMetadata {
        id: 932,
        name: "Kommonium Z",
    },
    &ItemMetadata {
        id: 933,
        name: "Z-Power Ring",
    },
    &ItemMetadata {
        id: 934,
        name: "Pink Petal",
    },
    &ItemMetadata {
        id: 935,
        name: "Orange Petal",
    },
    &ItemMetadata {
        id: 936,
        name: "Blue Petal",
    },
    &ItemMetadata {
        id: 937,
        name: "Red Petal",
    },
    &ItemMetadata {
        id: 938,
        name: "Green Petal",
    },
    &ItemMetadata {
        id: 939,
        name: "Yellow Petal",
    },
    &ItemMetadata {
        id: 940,
        name: "Purple Petal",
    },
    &ItemMetadata {
        id: 941,
        name: "Rainbow Flower",
    },
    &ItemMetadata {
        id: 942,
        name: "Surge Badge",
    },
    &ItemMetadata {
        id: 943,
        name: "N-Solarizer",
    },
    &ItemMetadata {
        id: 944,
        name: "N-Lunarizer",
    },
    &ItemMetadata {
        id: 945,
        name: "N-Solarizer",
    },
    &ItemMetadata {
        id: 946,
        name: "N-Lunarizer",
    },
    &ItemMetadata {
        id: 947,
        name: "Ilima’s Normalium Z",
    },
    &ItemMetadata {
        id: 948,
        name: "Left Poké Ball",
    },
    &ItemMetadata {
        id: 949,
        name: "Roto Hatch",
    },
    &ItemMetadata {
        id: 950,
        name: "Roto Bargain",
    },
    &ItemMetadata {
        id: 951,
        name: "Roto Prize Money",
    },
    &ItemMetadata {
        id: 952,
        name: "Roto Exp. Points",
    },
    &ItemMetadata {
        id: 953,
        name: "Roto Friendship",
    },
    &ItemMetadata {
        id: 954,
        name: "Roto Encounter",
    },
    &ItemMetadata {
        id: 955,
        name: "Roto Stealth",
    },
    &ItemMetadata {
        id: 956,
        name: "Roto HP Restore",
    },
    &ItemMetadata {
        id: 957,
        name: "Roto PP Restore",
    },
    &ItemMetadata {
        id: 958,
        name: "Roto Boost",
    },
    &ItemMetadata {
        id: 959,
        name: "Roto Catch",
    },
    &ItemMetadata {
        id: 960,
        name: "Health Candy",
    },
    &ItemMetadata {
        id: 961,
        name: "Mighty Candy",
    },
    &ItemMetadata {
        id: 962,
        name: "Tough Candy",
    },
    &ItemMetadata {
        id: 963,
        name: "Smart Candy",
    },
    &ItemMetadata {
        id: 964,
        name: "Courage Candy",
    },
    &ItemMetadata {
        id: 965,
        name: "Quick Candy",
    },
    &ItemMetadata {
        id: 966,
        name: "Health Candy L",
    },
    &ItemMetadata {
        id: 967,
        name: "Mighty Candy L",
    },
    &ItemMetadata {
        id: 968,
        name: "Tough Candy L",
    },
    &ItemMetadata {
        id: 969,
        name: "Smart Candy L",
    },
    &ItemMetadata {
        id: 970,
        name: "Courage Candy L",
    },
    &ItemMetadata {
        id: 971,
        name: "Quick Candy L",
    },
    &ItemMetadata {
        id: 972,
        name: "Health Candy XL",
    },
    &ItemMetadata {
        id: 973,
        name: "Mighty Candy XL",
    },
    &ItemMetadata {
        id: 974,
        name: "Tough Candy XL",
    },
    &ItemMetadata {
        id: 975,
        name: "Smart Candy XL",
    },
    &ItemMetadata {
        id: 976,
        name: "Courage Candy XL",
    },
    &ItemMetadata {
        id: 977,
        name: "Quick Candy XL",
    },
    &ItemMetadata {
        id: 978,
        name: "Bulbasaur Candy",
    },
    &ItemMetadata {
        id: 979,
        name: "Charmander Candy",
    },
    &ItemMetadata {
        id: 980,
        name: "Squirtle Candy",
    },
    &ItemMetadata {
        id: 981,
        name: "Caterpie Candy",
    },
    &ItemMetadata {
        id: 982,
        name: "Weedle Candy",
    },
    &ItemMetadata {
        id: 983,
        name: "Pidgey Candy",
    },
    &ItemMetadata {
        id: 984,
        name: "Rattata Candy",
    },
    &ItemMetadata {
        id: 985,
        name: "Spearow Candy",
    },
    &ItemMetadata {
        id: 986,
        name: "Ekans Candy",
    },
    &ItemMetadata {
        id: 987,
        name: "Pikachu Candy",
    },
    &ItemMetadata {
        id: 988,
        name: "Sandshrew Candy",
    },
    &ItemMetadata {
        id: 989,
        name: "Nidoran♀ Candy",
    },
    &ItemMetadata {
        id: 990,
        name: "Nidoran♂ Candy",
    },
    &ItemMetadata {
        id: 991,
        name: "Clefairy Candy",
    },
    &ItemMetadata {
        id: 992,
        name: "Vulpix Candy",
    },
    &ItemMetadata {
        id: 993,
        name: "Jigglypuff Candy",
    },
    &ItemMetadata {
        id: 994,
        name: "Zubat Candy",
    },
    &ItemMetadata {
        id: 995,
        name: "Oddish Candy",
    },
    &ItemMetadata {
        id: 996,
        name: "Paras Candy",
    },
    &ItemMetadata {
        id: 997,
        name: "Venonat Candy",
    },
    &ItemMetadata {
        id: 998,
        name: "Diglett Candy",
    },
    &ItemMetadata {
        id: 999,
        name: "Meowth Candy",
    },
    &ItemMetadata {
        id: 1000,
        name: "Psyduck Candy",
    },
    &ItemMetadata {
        id: 1001,
        name: "Mankey Candy",
    },
    &ItemMetadata {
        id: 1002,
        name: "Growlithe Candy",
    },
    &ItemMetadata {
        id: 1003,
        name: "Poliwag Candy",
    },
    &ItemMetadata {
        id: 1004,
        name: "Abra Candy",
    },
    &ItemMetadata {
        id: 1005,
        name: "Machop Candy",
    },
    &ItemMetadata {
        id: 1006,
        name: "Bellsprout Candy",
    },
    &ItemMetadata {
        id: 1007,
        name: "Tentacool Candy",
    },
    &ItemMetadata {
        id: 1008,
        name: "Geodude Candy",
    },
    &ItemMetadata {
        id: 1009,
        name: "Ponyta Candy",
    },
    &ItemMetadata {
        id: 1010,
        name: "Slowpoke Candy",
    },
    &ItemMetadata {
        id: 1011,
        name: "Magnemite Candy",
    },
    &ItemMetadata {
        id: 1012,
        name: "Farfetch’d Candy",
    },
    &ItemMetadata {
        id: 1013,
        name: "Doduo Candy",
    },
    &ItemMetadata {
        id: 1014,
        name: "Seel Candy",
    },
    &ItemMetadata {
        id: 1015,
        name: "Grimer Candy",
    },
    &ItemMetadata {
        id: 1016,
        name: "Shellder Candy",
    },
    &ItemMetadata {
        id: 1017,
        name: "Gastly Candy",
    },
    &ItemMetadata {
        id: 1018,
        name: "Onix Candy",
    },
    &ItemMetadata {
        id: 1019,
        name: "Drowzee Candy",
    },
    &ItemMetadata {
        id: 1020,
        name: "Krabby Candy",
    },
    &ItemMetadata {
        id: 1021,
        name: "Voltorb Candy",
    },
    &ItemMetadata {
        id: 1022,
        name: "Exeggcute Candy",
    },
    &ItemMetadata {
        id: 1023,
        name: "Cubone Candy",
    },
    &ItemMetadata {
        id: 1024,
        name: "Hitmonlee Candy",
    },
    &ItemMetadata {
        id: 1025,
        name: "Hitmonchan Candy",
    },
    &ItemMetadata {
        id: 1026,
        name: "Lickitung Candy",
    },
    &ItemMetadata {
        id: 1027,
        name: "Koffing Candy",
    },
    &ItemMetadata {
        id: 1028,
        name: "Rhyhorn Candy",
    },
    &ItemMetadata {
        id: 1029,
        name: "Chansey Candy",
    },
    &ItemMetadata {
        id: 1030,
        name: "Tangela Candy",
    },
    &ItemMetadata {
        id: 1031,
        name: "Kangaskhan Candy",
    },
    &ItemMetadata {
        id: 1032,
        name: "Horsea Candy",
    },
    &ItemMetadata {
        id: 1033,
        name: "Goldeen Candy",
    },
    &ItemMetadata {
        id: 1034,
        name: "Staryu Candy",
    },
    &ItemMetadata {
        id: 1035,
        name: "Mr. Mime Candy",
    },
    &ItemMetadata {
        id: 1036,
        name: "Scyther Candy",
    },
    &ItemMetadata {
        id: 1037,
        name: "Jynx Candy",
    },
    &ItemMetadata {
        id: 1038,
        name: "Electabuzz Candy",
    },
    &ItemMetadata {
        id: 1039,
        name: "Pinsir Candy",
    },
    &ItemMetadata {
        id: 1040,
        name: "Tauros Candy",
    },
    &ItemMetadata {
        id: 1041,
        name: "Magikarp Candy",
    },
    &ItemMetadata {
        id: 1042,
        name: "Lapras Candy",
    },
    &ItemMetadata {
        id: 1043,
        name: "Ditto Candy",
    },
    &ItemMetadata {
        id: 1044,
        name: "Eevee Candy",
    },
    &ItemMetadata {
        id: 1045,
        name: "Porygon Candy",
    },
    &ItemMetadata {
        id: 1046,
        name: "Omanyte Candy",
    },
    &ItemMetadata {
        id: 1047,
        name: "Kabuto Candy",
    },
    &ItemMetadata {
        id: 1048,
        name: "Aerodactyl Candy",
    },
    &ItemMetadata {
        id: 1049,
        name: "Snorlax Candy",
    },
    &ItemMetadata {
        id: 1050,
        name: "Articuno Candy",
    },
    &ItemMetadata {
        id: 1051,
        name: "Zapdos Candy",
    },
    &ItemMetadata {
        id: 1052,
        name: "Moltres Candy",
    },
    &ItemMetadata {
        id: 1053,
        name: "Dratini Candy",
    },
    &ItemMetadata {
        id: 1054,
        name: "Mewtwo Candy",
    },
    &ItemMetadata {
        id: 1055,
        name: "Mew Candy",
    },
    &ItemMetadata {
        id: 1056,
        name: "Meltan Candy",
    },
    &ItemMetadata {
        id: 1057,
        name: "Magmar Candy",
    },
    &ItemMetadata {
        id: 1058,
        name: "???",
    },
    &ItemMetadata {
        id: 1059,
        name: "???",
    },
    &ItemMetadata {
        id: 1060,
        name: "???",
    },
    &ItemMetadata {
        id: 1061,
        name: "???",
    },
    &ItemMetadata {
        id: 1062,
        name: "???",
    },
    &ItemMetadata {
        id: 1063,
        name: "???",
    },
    &ItemMetadata {
        id: 1064,
        name: "???",
    },
    &ItemMetadata {
        id: 1065,
        name: "???",
    },
    &ItemMetadata {
        id: 1066,
        name: "???",
    },
    &ItemMetadata {
        id: 1067,
        name: "???",
    },
    &ItemMetadata {
        id: 1068,
        name: "???",
    },
    &ItemMetadata {
        id: 1069,
        name: "???",
    },
    &ItemMetadata {
        id: 1070,
        name: "???",
    },
    &ItemMetadata {
        id: 1071,
        name: "???",
    },
    &ItemMetadata {
        id: 1072,
        name: "???",
    },
    &ItemMetadata {
        id: 1073,
        name: "???",
    },
    &ItemMetadata {
        id: 1074,
        name: "Endorsement",
    },
    &ItemMetadata {
        id: 1075,
        name: "Pokémon Box Link",
    },
    &ItemMetadata {
        id: 1076,
        name: "Wishing Star",
    },
    &ItemMetadata {
        id: 1077,
        name: "Dynamax Band",
    },
    &ItemMetadata {
        id: 1078,
        name: "???",
    },
    &ItemMetadata {
        id: 1079,
        name: "???",
    },
    &ItemMetadata {
        id: 1080,
        name: "Fishing Rod",
    },
    &ItemMetadata {
        id: 1081,
        name: "Rotom Bike",
    },
    &ItemMetadata {
        id: 1082,
        name: "???",
    },
    &ItemMetadata {
        id: 1083,
        name: "???",
    },
    &ItemMetadata {
        id: 1084,
        name: "Sausages",
    },
    &ItemMetadata {
        id: 1085,
        name: "Bob’s Food Tin",
    },
    &ItemMetadata {
        id: 1086,
        name: "Bach’s Food Tin",
    },
    &ItemMetadata {
        id: 1087,
        name: "Tin of Beans",
    },
    &ItemMetadata {
        id: 1088,
        name: "Bread",
    },
    &ItemMetadata {
        id: 1089,
        name: "Pasta",
    },
    &ItemMetadata {
        id: 1090,
        name: "Mixed Mushrooms",
    },
    &ItemMetadata {
        id: 1091,
        name: "Smoke-Poke Tail",
    },
    &ItemMetadata {
        id: 1092,
        name: "Large Leek",
    },
    &ItemMetadata {
        id: 1093,
        name: "Fancy Apple",
    },
    &ItemMetadata {
        id: 1094,
        name: "Brittle Bones",
    },
    &ItemMetadata {
        id: 1095,
        name: "Pack of Potatoes",
    },
    &ItemMetadata {
        id: 1096,
        name: "Pungent Root",
    },
    &ItemMetadata {
        id: 1097,
        name: "Salad Mix",
    },
    &ItemMetadata {
        id: 1098,
        name: "Fried Food",
    },
    &ItemMetadata {
        id: 1099,
        name: "Boiled Egg",
    },
    &ItemMetadata {
        id: 1100,
        name: "Camping Gear",
    },
    &ItemMetadata {
        id: 1101,
        name: "???",
    },
    &ItemMetadata {
        id: 1102,
        name: "???",
    },
    &ItemMetadata {
        id: 1103,
        name: "Rusted Sword",
    },
    &ItemMetadata {
        id: 1104,
        name: "Rusted Shield",
    },
    &ItemMetadata {
        id: 1105,
        name: "Fossilized Bird",
    },
    &ItemMetadata {
        id: 1106,
        name: "Fossilized Fish",
    },
    &ItemMetadata {
        id: 1107,
        name: "Fossilized Drake",
    },
    &ItemMetadata {
        id: 1108,
        name: "Fossilized Dino",
    },
    &ItemMetadata {
        id: 1109,
        name: "Strawberry Sweet",
    },
    &ItemMetadata {
        id: 1110,
        name: "Love Sweet",
    },
    &ItemMetadata {
        id: 1111,
        name: "Berry Sweet",
    },
    &ItemMetadata {
        id: 1112,
        name: "Clover Sweet",
    },
    &ItemMetadata {
        id: 1113,
        name: "Flower Sweet",
    },
    &ItemMetadata {
        id: 1114,
        name: "Star Sweet",
    },
    &ItemMetadata {
        id: 1115,
        name: "Ribbon Sweet",
    },
    &ItemMetadata {
        id: 1116,
        name: "Sweet Apple",
    },
    &ItemMetadata {
        id: 1117,
        name: "Tart Apple",
    },
    &ItemMetadata {
        id: 1118,
        name: "Throat Spray",
    },
    &ItemMetadata {
        id: 1119,
        name: "Eject Pack",
    },
    &ItemMetadata {
        id: 1120,
        name: "Heavy-Duty Boots",
    },
    &ItemMetadata {
        id: 1121,
        name: "Blunder Policy",
    },
    &ItemMetadata {
        id: 1122,
        name: "Room Service",
    },
    &ItemMetadata {
        id: 1123,
        name: "Utility Umbrella",
    },
    &ItemMetadata {
        id: 1124,
        name: "Exp. Candy XS",
    },
    &ItemMetadata {
        id: 1125,
        name: "Exp. Candy S",
    },
    &ItemMetadata {
        id: 1126,
        name: "Exp. Candy M",
    },
    &ItemMetadata {
        id: 1127,
        name: "Exp. Candy L",
    },
    &ItemMetadata {
        id: 1128,
        name: "Exp. Candy XL",
    },
    &ItemMetadata {
        id: 1129,
        name: "Dynamax Candy",
    },
    &ItemMetadata {
        id: 1130,
        name: "TR00",
    },
    &ItemMetadata {
        id: 1131,
        name: "TR01",
    },
    &ItemMetadata {
        id: 1132,
        name: "TR02",
    },
    &ItemMetadata {
        id: 1133,
        name: "TR03",
    },
    &ItemMetadata {
        id: 1134,
        name: "TR04",
    },
    &ItemMetadata {
        id: 1135,
        name: "TR05",
    },
    &ItemMetadata {
        id: 1136,
        name: "TR06",
    },
    &ItemMetadata {
        id: 1137,
        name: "TR07",
    },
    &ItemMetadata {
        id: 1138,
        name: "TR08",
    },
    &ItemMetadata {
        id: 1139,
        name: "TR09",
    },
    &ItemMetadata {
        id: 1140,
        name: "TR10",
    },
    &ItemMetadata {
        id: 1141,
        name: "TR11",
    },
    &ItemMetadata {
        id: 1142,
        name: "TR12",
    },
    &ItemMetadata {
        id: 1143,
        name: "TR13",
    },
    &ItemMetadata {
        id: 1144,
        name: "TR14",
    },
    &ItemMetadata {
        id: 1145,
        name: "TR15",
    },
    &ItemMetadata {
        id: 1146,
        name: "TR16",
    },
    &ItemMetadata {
        id: 1147,
        name: "TR17",
    },
    &ItemMetadata {
        id: 1148,
        name: "TR18",
    },
    &ItemMetadata {
        id: 1149,
        name: "TR19",
    },
    &ItemMetadata {
        id: 1150,
        name: "TR20",
    },
    &ItemMetadata {
        id: 1151,
        name: "TR21",
    },
    &ItemMetadata {
        id: 1152,
        name: "TR22",
    },
    &ItemMetadata {
        id: 1153,
        name: "TR23",
    },
    &ItemMetadata {
        id: 1154,
        name: "TR24",
    },
    &ItemMetadata {
        id: 1155,
        name: "TR25",
    },
    &ItemMetadata {
        id: 1156,
        name: "TR26",
    },
    &ItemMetadata {
        id: 1157,
        name: "TR27",
    },
    &ItemMetadata {
        id: 1158,
        name: "TR28",
    },
    &ItemMetadata {
        id: 1159,
        name: "TR29",
    },
    &ItemMetadata {
        id: 1160,
        name: "TR30",
    },
    &ItemMetadata {
        id: 1161,
        name: "TR31",
    },
    &ItemMetadata {
        id: 1162,
        name: "TR32",
    },
    &ItemMetadata {
        id: 1163,
        name: "TR33",
    },
    &ItemMetadata {
        id: 1164,
        name: "TR34",
    },
    &ItemMetadata {
        id: 1165,
        name: "TR35",
    },
    &ItemMetadata {
        id: 1166,
        name: "TR36",
    },
    &ItemMetadata {
        id: 1167,
        name: "TR37",
    },
    &ItemMetadata {
        id: 1168,
        name: "TR38",
    },
    &ItemMetadata {
        id: 1169,
        name: "TR39",
    },
    &ItemMetadata {
        id: 1170,
        name: "TR40",
    },
    &ItemMetadata {
        id: 1171,
        name: "TR41",
    },
    &ItemMetadata {
        id: 1172,
        name: "TR42",
    },
    &ItemMetadata {
        id: 1173,
        name: "TR43",
    },
    &ItemMetadata {
        id: 1174,
        name: "TR44",
    },
    &ItemMetadata {
        id: 1175,
        name: "TR45",
    },
    &ItemMetadata {
        id: 1176,
        name: "TR46",
    },
    &ItemMetadata {
        id: 1177,
        name: "TR47",
    },
    &ItemMetadata {
        id: 1178,
        name: "TR48",
    },
    &ItemMetadata {
        id: 1179,
        name: "TR49",
    },
    &ItemMetadata {
        id: 1180,
        name: "TR50",
    },
    &ItemMetadata {
        id: 1181,
        name: "TR51",
    },
    &ItemMetadata {
        id: 1182,
        name: "TR52",
    },
    &ItemMetadata {
        id: 1183,
        name: "TR53",
    },
    &ItemMetadata {
        id: 1184,
        name: "TR54",
    },
    &ItemMetadata {
        id: 1185,
        name: "TR55",
    },
    &ItemMetadata {
        id: 1186,
        name: "TR56",
    },
    &ItemMetadata {
        id: 1187,
        name: "TR57",
    },
    &ItemMetadata {
        id: 1188,
        name: "TR58",
    },
    &ItemMetadata {
        id: 1189,
        name: "TR59",
    },
    &ItemMetadata {
        id: 1190,
        name: "TR60",
    },
    &ItemMetadata {
        id: 1191,
        name: "TR61",
    },
    &ItemMetadata {
        id: 1192,
        name: "TR62",
    },
    &ItemMetadata {
        id: 1193,
        name: "TR63",
    },
    &ItemMetadata {
        id: 1194,
        name: "TR64",
    },
    &ItemMetadata {
        id: 1195,
        name: "TR65",
    },
    &ItemMetadata {
        id: 1196,
        name: "TR66",
    },
    &ItemMetadata {
        id: 1197,
        name: "TR67",
    },
    &ItemMetadata {
        id: 1198,
        name: "TR68",
    },
    &ItemMetadata {
        id: 1199,
        name: "TR69",
    },
    &ItemMetadata {
        id: 1200,
        name: "TR70",
    },
    &ItemMetadata {
        id: 1201,
        name: "TR71",
    },
    &ItemMetadata {
        id: 1202,
        name: "TR72",
    },
    &ItemMetadata {
        id: 1203,
        name: "TR73",
    },
    &ItemMetadata {
        id: 1204,
        name: "TR74",
    },
    &ItemMetadata {
        id: 1205,
        name: "TR75",
    },
    &ItemMetadata {
        id: 1206,
        name: "TR76",
    },
    &ItemMetadata {
        id: 1207,
        name: "TR77",
    },
    &ItemMetadata {
        id: 1208,
        name: "TR78",
    },
    &ItemMetadata {
        id: 1209,
        name: "TR79",
    },
    &ItemMetadata {
        id: 1210,
        name: "TR80",
    },
    &ItemMetadata {
        id: 1211,
        name: "TR81",
    },
    &ItemMetadata {
        id: 1212,
        name: "TR82",
    },
    &ItemMetadata {
        id: 1213,
        name: "TR83",
    },
    &ItemMetadata {
        id: 1214,
        name: "TR84",
    },
    &ItemMetadata {
        id: 1215,
        name: "TR85",
    },
    &ItemMetadata {
        id: 1216,
        name: "TR86",
    },
    &ItemMetadata {
        id: 1217,
        name: "TR87",
    },
    &ItemMetadata {
        id: 1218,
        name: "TR88",
    },
    &ItemMetadata {
        id: 1219,
        name: "TR89",
    },
    &ItemMetadata {
        id: 1220,
        name: "TR90",
    },
    &ItemMetadata {
        id: 1221,
        name: "TR91",
    },
    &ItemMetadata {
        id: 1222,
        name: "TR92",
    },
    &ItemMetadata {
        id: 1223,
        name: "TR93",
    },
    &ItemMetadata {
        id: 1224,
        name: "TR94",
    },
    &ItemMetadata {
        id: 1225,
        name: "TR95",
    },
    &ItemMetadata {
        id: 1226,
        name: "TR96",
    },
    &ItemMetadata {
        id: 1227,
        name: "TR97",
    },
    &ItemMetadata {
        id: 1228,
        name: "TR98",
    },
    &ItemMetadata {
        id: 1229,
        name: "TR99",
    },
    &ItemMetadata {
        id: 1230,
        name: "TM00",
    },
    &ItemMetadata {
        id: 1231,
        name: "Lonely Mint",
    },
    &ItemMetadata {
        id: 1232,
        name: "Adamant Mint",
    },
    &ItemMetadata {
        id: 1233,
        name: "Naughty Mint",
    },
    &ItemMetadata {
        id: 1234,
        name: "Brave Mint",
    },
    &ItemMetadata {
        id: 1235,
        name: "Bold Mint",
    },
    &ItemMetadata {
        id: 1236,
        name: "Impish Mint",
    },
    &ItemMetadata {
        id: 1237,
        name: "Lax Mint",
    },
    &ItemMetadata {
        id: 1238,
        name: "Relaxed Mint",
    },
    &ItemMetadata {
        id: 1239,
        name: "Modest Mint",
    },
    &ItemMetadata {
        id: 1240,
        name: "Mild Mint",
    },
    &ItemMetadata {
        id: 1241,
        name: "Rash Mint",
    },
    &ItemMetadata {
        id: 1242,
        name: "Quiet Mint",
    },
    &ItemMetadata {
        id: 1243,
        name: "Calm Mint",
    },
    &ItemMetadata {
        id: 1244,
        name: "Gentle Mint",
    },
    &ItemMetadata {
        id: 1245,
        name: "Careful Mint",
    },
    &ItemMetadata {
        id: 1246,
        name: "Sassy Mint",
    },
    &ItemMetadata {
        id: 1247,
        name: "Timid Mint",
    },
    &ItemMetadata {
        id: 1248,
        name: "Hasty Mint",
    },
    &ItemMetadata {
        id: 1249,
        name: "Jolly Mint",
    },
    &ItemMetadata {
        id: 1250,
        name: "Naive Mint",
    },
    &ItemMetadata {
        id: 1251,
        name: "Serious Mint",
    },
    &ItemMetadata {
        id: 1252,
        name: "Wishing Piece",
    },
    &ItemMetadata {
        id: 1253,
        name: "Cracked Pot",
    },
    &ItemMetadata {
        id: 1254,
        name: "Chipped Pot",
    },
    &ItemMetadata {
        id: 1255,
        name: "Hi-tech Earbuds",
    },
    &ItemMetadata {
        id: 1256,
        name: "Fruit Bunch",
    },
    &ItemMetadata {
        id: 1257,
        name: "Moomoo Cheese",
    },
    &ItemMetadata {
        id: 1258,
        name: "Spice Mix",
    },
    &ItemMetadata {
        id: 1259,
        name: "Fresh Cream",
    },
    &ItemMetadata {
        id: 1260,
        name: "Packaged Curry",
    },
    &ItemMetadata {
        id: 1261,
        name: "Coconut Milk",
    },
    &ItemMetadata {
        id: 1262,
        name: "Instant Noodles",
    },
    &ItemMetadata {
        id: 1263,
        name: "Precooked Burger",
    },
    &ItemMetadata {
        id: 1264,
        name: "Gigantamix",
    },
    &ItemMetadata {
        id: 1265,
        name: "Wishing Chip",
    },
    &ItemMetadata {
        id: 1266,
        name: "Rotom Bike",
    },
    &ItemMetadata {
        id: 1267,
        name: "Catching Charm",
    },
    &ItemMetadata {
        id: 1268,
        name: "???",
    },
    &ItemMetadata {
        id: 1269,
        name: "Old Letter",
    },
    &ItemMetadata {
        id: 1270,
        name: "Band Autograph",
    },
    &ItemMetadata {
        id: 1271,
        name: "Sonia’s Book",
    },
    &ItemMetadata {
        id: 1272,
        name: "???",
    },
    &ItemMetadata {
        id: 1273,
        name: "???",
    },
    &ItemMetadata {
        id: 1274,
        name: "???",
    },
    &ItemMetadata {
        id: 1275,
        name: "???",
    },
    &ItemMetadata {
        id: 1276,
        name: "???",
    },
    &ItemMetadata {
        id: 1277,
        name: "???",
    },
    &ItemMetadata {
        id: 1278,
        name: "Rotom Catalog",
    },
    &ItemMetadata {
        id: 1279,
        name: "★And458",
    },
    &ItemMetadata {
        id: 1280,
        name: "★And15",
    },
    &ItemMetadata {
        id: 1281,
        name: "★And337",
    },
    &ItemMetadata {
        id: 1282,
        name: "★And603",
    },
    &ItemMetadata {
        id: 1283,
        name: "★And390",
    },
    &ItemMetadata {
        id: 1284,
        name: "★Sgr6879",
    },
    &ItemMetadata {
        id: 1285,
        name: "★Sgr6859",
    },
    &ItemMetadata {
        id: 1286,
        name: "★Sgr6913",
    },
    &ItemMetadata {
        id: 1287,
        name: "★Sgr7348",
    },
    &ItemMetadata {
        id: 1288,
        name: "★Sgr7121",
    },
    &ItemMetadata {
        id: 1289,
        name: "★Sgr6746",
    },
    &ItemMetadata {
        id: 1290,
        name: "★Sgr7194",
    },
    &ItemMetadata {
        id: 1291,
        name: "★Sgr7337",
    },
    &ItemMetadata {
        id: 1292,
        name: "★Sgr7343",
    },
    &ItemMetadata {
        id: 1293,
        name: "★Sgr6812",
    },
    &ItemMetadata {
        id: 1294,
        name: "★Sgr7116",
    },
    &ItemMetadata {
        id: 1295,
        name: "★Sgr7264",
    },
    &ItemMetadata {
        id: 1296,
        name: "★Sgr7597",
    },
    &ItemMetadata {
        id: 1297,
        name: "★Del7882",
    },
    &ItemMetadata {
        id: 1298,
        name: "★Del7906",
    },
    &ItemMetadata {
        id: 1299,
        name: "★Del7852",
    },
    &ItemMetadata {
        id: 1300,
        name: "★Psc596",
    },
    &ItemMetadata {
        id: 1301,
        name: "★Psc361",
    },
    &ItemMetadata {
        id: 1302,
        name: "★Psc510",
    },
    &ItemMetadata {
        id: 1303,
        name: "★Psc437",
    },
    &ItemMetadata {
        id: 1304,
        name: "★Psc8773",
    },
    &ItemMetadata {
        id: 1305,
        name: "★Lep1865",
    },
    &ItemMetadata {
        id: 1306,
        name: "★Lep1829",
    },
    &ItemMetadata {
        id: 1307,
        name: "★Boo5340",
    },
    &ItemMetadata {
        id: 1308,
        name: "★Boo5506",
    },
    &ItemMetadata {
        id: 1309,
        name: "★Boo5435",
    },
    &ItemMetadata {
        id: 1310,
        name: "★Boo5602",
    },
    &ItemMetadata {
        id: 1311,
        name: "★Boo5733",
    },
    &ItemMetadata {
        id: 1312,
        name: "★Boo5235",
    },
    &ItemMetadata {
        id: 1313,
        name: "★Boo5351",
    },
    &ItemMetadata {
        id: 1314,
        name: "★Hya3748",
    },
    &ItemMetadata {
        id: 1315,
        name: "★Hya3903",
    },
    &ItemMetadata {
        id: 1316,
        name: "★Hya3418",
    },
    &ItemMetadata {
        id: 1317,
        name: "★Hya3482",
    },
    &ItemMetadata {
        id: 1318,
        name: "★Hya3845",
    },
    &ItemMetadata {
        id: 1319,
        name: "★Eri1084",
    },
    &ItemMetadata {
        id: 1320,
        name: "★Eri472",
    },
    &ItemMetadata {
        id: 1321,
        name: "★Eri1666",
    },
    &ItemMetadata {
        id: 1322,
        name: "★Eri897",
    },
    &ItemMetadata {
        id: 1323,
        name: "★Eri1231",
    },
    &ItemMetadata {
        id: 1324,
        name: "★Eri874",
    },
    &ItemMetadata {
        id: 1325,
        name: "★Eri1298",
    },
    &ItemMetadata {
        id: 1326,
        name: "★Eri1325",
    },
    &ItemMetadata {
        id: 1327,
        name: "★Eri984",
    },
    &ItemMetadata {
        id: 1328,
        name: "★Eri1464",
    },
    &ItemMetadata {
        id: 1329,
        name: "★Eri1393",
    },
    &ItemMetadata {
        id: 1330,
        name: "★Eri850",
    },
    &ItemMetadata {
        id: 1331,
        name: "★Tau1409",
    },
    &ItemMetadata {
        id: 1332,
        name: "★Tau1457",
    },
    &ItemMetadata {
        id: 1333,
        name: "★Tau1165",
    },
    &ItemMetadata {
        id: 1334,
        name: "★Tau1791",
    },
    &ItemMetadata {
        id: 1335,
        name: "★Tau1910",
    },
    &ItemMetadata {
        id: 1336,
        name: "★Tau1346",
    },
    &ItemMetadata {
        id: 1337,
        name: "★Tau1373",
    },
    &ItemMetadata {
        id: 1338,
        name: "★Tau1412",
    },
    &ItemMetadata {
        id: 1339,
        name: "★CMa2491",
    },
    &ItemMetadata {
        id: 1340,
        name: "★CMa2693",
    },
    &ItemMetadata {
        id: 1341,
        name: "★CMa2294",
    },
    &ItemMetadata {
        id: 1342,
        name: "★CMa2827",
    },
    &ItemMetadata {
        id: 1343,
        name: "★CMa2282",
    },
    &ItemMetadata {
        id: 1344,
        name: "★CMa2618",
    },
    &ItemMetadata {
        id: 1345,
        name: "★CMa2657",
    },
    &ItemMetadata {
        id: 1346,
        name: "★CMa2646",
    },
    &ItemMetadata {
        id: 1347,
        name: "★UMa4905",
    },
    &ItemMetadata {
        id: 1348,
        name: "★UMa4301",
    },
    &ItemMetadata {
        id: 1349,
        name: "★UMa5191",
    },
    &ItemMetadata {
        id: 1350,
        name: "★UMa5054",
    },
    &ItemMetadata {
        id: 1351,
        name: "★UMa4295",
    },
    &ItemMetadata {
        id: 1352,
        name: "★UMa4660",
    },
    &ItemMetadata {
        id: 1353,
        name: "★UMa4554",
    },
    &ItemMetadata {
        id: 1354,
        name: "★UMa4069",
    },
    &ItemMetadata {
        id: 1355,
        name: "★UMa3569",
    },
    &ItemMetadata {
        id: 1356,
        name: "★UMa3323",
    },
    &ItemMetadata {
        id: 1357,
        name: "★UMa4033",
    },
    &ItemMetadata {
        id: 1358,
        name: "★UMa4377",
    },
    &ItemMetadata {
        id: 1359,
        name: "★UMa4375",
    },
    &ItemMetadata {
        id: 1360,
        name: "★UMa4518",
    },
    &ItemMetadata {
        id: 1361,
        name: "★UMa3594",
    },
    &ItemMetadata {
        id: 1362,
        name: "★Vir5056",
    },
    &ItemMetadata {
        id: 1363,
        name: "★Vir4825",
    },
    &ItemMetadata {
        id: 1364,
        name: "★Vir4932",
    },
    &ItemMetadata {
        id: 1365,
        name: "★Vir4540",
    },
    &ItemMetadata {
        id: 1366,
        name: "★Vir4689",
    },
    &ItemMetadata {
        id: 1367,
        name: "★Vir5338",
    },
    &ItemMetadata {
        id: 1368,
        name: "★Vir4910",
    },
    &ItemMetadata {
        id: 1369,
        name: "★Vir5315",
    },
    &ItemMetadata {
        id: 1370,
        name: "★Vir5359",
    },
    &ItemMetadata {
        id: 1371,
        name: "★Vir5409",
    },
    &ItemMetadata {
        id: 1372,
        name: "★Vir5107",
    },
    &ItemMetadata {
        id: 1373,
        name: "★Ari617",
    },
    &ItemMetadata {
        id: 1374,
        name: "★Ari553",
    },
    &ItemMetadata {
        id: 1375,
        name: "★Ari546",
    },
    &ItemMetadata {
        id: 1376,
        name: "★Ari951",
    },
    &ItemMetadata {
        id: 1377,
        name: "★Ori1713",
    },
    &ItemMetadata {
        id: 1378,
        name: "★Ori2061",
    },
    &ItemMetadata {
        id: 1379,
        name: "★Ori1790",
    },
    &ItemMetadata {
        id: 1380,
        name: "★Ori1903",
    },
    &ItemMetadata {
        id: 1381,
        name: "★Ori1948",
    },
    &ItemMetadata {
        id: 1382,
        name: "★Ori2004",
    },
    &ItemMetadata {
        id: 1383,
        name: "★Ori1852",
    },
    &ItemMetadata {
        id: 1384,
        name: "★Ori1879",
    },
    &ItemMetadata {
        id: 1385,
        name: "★Ori1899",
    },
    &ItemMetadata {
        id: 1386,
        name: "★Ori1543",
    },
    &ItemMetadata {
        id: 1387,
        name: "★Cas21",
    },
    &ItemMetadata {
        id: 1388,
        name: "★Cas168",
    },
    &ItemMetadata {
        id: 1389,
        name: "★Cas403",
    },
    &ItemMetadata {
        id: 1390,
        name: "★Cas153",
    },
    &ItemMetadata {
        id: 1391,
        name: "★Cas542",
    },
    &ItemMetadata {
        id: 1392,
        name: "★Cas219",
    },
    &ItemMetadata {
        id: 1393,
        name: "★Cas265",
    },
    &ItemMetadata {
        id: 1394,
        name: "★Cnc3572",
    },
    &ItemMetadata {
        id: 1395,
        name: "★Cnc3208",
    },
    &ItemMetadata {
        id: 1396,
        name: "★Cnc3461",
    },
    &ItemMetadata {
        id: 1397,
        name: "★Cnc3449",
    },
    &ItemMetadata {
        id: 1398,
        name: "★Cnc3429",
    },
    &ItemMetadata {
        id: 1399,
        name: "★Cnc3627",
    },
    &ItemMetadata {
        id: 1400,
        name: "★Cnc3268",
    },
    &ItemMetadata {
        id: 1401,
        name: "★Cnc3249",
    },
    &ItemMetadata {
        id: 1402,
        name: "★Com4968",
    },
    &ItemMetadata {
        id: 1403,
        name: "★Crv4757",
    },
    &ItemMetadata {
        id: 1404,
        name: "★Crv4623",
    },
    &ItemMetadata {
        id: 1405,
        name: "★Crv4662",
    },
    &ItemMetadata {
        id: 1406,
        name: "★Crv4786",
    },
    &ItemMetadata {
        id: 1407,
        name: "★Aur1708",
    },
    &ItemMetadata {
        id: 1408,
        name: "★Aur2088",
    },
    &ItemMetadata {
        id: 1409,
        name: "★Aur1605",
    },
    &ItemMetadata {
        id: 1410,
        name: "★Aur2095",
    },
    &ItemMetadata {
        id: 1411,
        name: "★Aur1577",
    },
    &ItemMetadata {
        id: 1412,
        name: "★Aur1641",
    },
    &ItemMetadata {
        id: 1413,
        name: "★Aur1612",
    },
    &ItemMetadata {
        id: 1414,
        name: "★Pav7790",
    },
    &ItemMetadata {
        id: 1415,
        name: "★Cet911",
    },
    &ItemMetadata {
        id: 1416,
        name: "★Cet681",
    },
    &ItemMetadata {
        id: 1417,
        name: "★Cet188",
    },
    &ItemMetadata {
        id: 1418,
        name: "★Cet539",
    },
    &ItemMetadata {
        id: 1419,
        name: "★Cet804",
    },
    &ItemMetadata {
        id: 1420,
        name: "★Cep8974",
    },
    &ItemMetadata {
        id: 1421,
        name: "★Cep8162",
    },
    &ItemMetadata {
        id: 1422,
        name: "★Cep8238",
    },
    &ItemMetadata {
        id: 1423,
        name: "★Cep8417",
    },
    &ItemMetadata {
        id: 1424,
        name: "★Cen5267",
    },
    &ItemMetadata {
        id: 1425,
        name: "★Cen5288",
    },
    &ItemMetadata {
        id: 1426,
        name: "★Cen551",
    },
    &ItemMetadata {
        id: 1427,
        name: "★Cen5459",
    },
    &ItemMetadata {
        id: 1428,
        name: "★Cen5460",
    },
    &ItemMetadata {
        id: 1429,
        name: "★CMi2943",
    },
    &ItemMetadata {
        id: 1430,
        name: "★CMi2845",
    },
    &ItemMetadata {
        id: 1431,
        name: "★Equ8131",
    },
    &ItemMetadata {
        id: 1432,
        name: "★Vul7405",
    },
    &ItemMetadata {
        id: 1433,
        name: "★UMi424",
    },
    &ItemMetadata {
        id: 1434,
        name: "★UMi5563",
    },
    &ItemMetadata {
        id: 1435,
        name: "★UMi5735",
    },
    &ItemMetadata {
        id: 1436,
        name: "★UMi6789",
    },
    &ItemMetadata {
        id: 1437,
        name: "★Crt4287",
    },
    &ItemMetadata {
        id: 1438,
        name: "★Lyr7001",
    },
    &ItemMetadata {
        id: 1439,
        name: "★Lyr7178",
    },
    &ItemMetadata {
        id: 1440,
        name: "★Lyr7106",
    },
    &ItemMetadata {
        id: 1441,
        name: "★Lyr7298",
    },
    &ItemMetadata {
        id: 1442,
        name: "★Ara6585",
    },
    &ItemMetadata {
        id: 1443,
        name: "★Sco6134",
    },
    &ItemMetadata {
        id: 1444,
        name: "★Sco6527",
    },
    &ItemMetadata {
        id: 1445,
        name: "★Sco6553",
    },
    &ItemMetadata {
        id: 1446,
        name: "★Sco5953",
    },
    &ItemMetadata {
        id: 1447,
        name: "★Sco5984",
    },
    &ItemMetadata {
        id: 1448,
        name: "★Sco6508",
    },
    &ItemMetadata {
        id: 1449,
        name: "★Sco6084",
    },
    &ItemMetadata {
        id: 1450,
        name: "★Sco5944",
    },
    &ItemMetadata {
        id: 1451,
        name: "★Sco6630",
    },
    &ItemMetadata {
        id: 1452,
        name: "★Sco6027",
    },
    &ItemMetadata {
        id: 1453,
        name: "★Sco6247",
    },
    &ItemMetadata {
        id: 1454,
        name: "★Sco6252",
    },
    &ItemMetadata {
        id: 1455,
        name: "★Sco5928",
    },
    &ItemMetadata {
        id: 1456,
        name: "★Sco6241",
    },
    &ItemMetadata {
        id: 1457,
        name: "★Sco6165",
    },
    &ItemMetadata {
        id: 1458,
        name: "★Tri544",
    },
    &ItemMetadata {
        id: 1459,
        name: "★Leo3982",
    },
    &ItemMetadata {
        id: 1460,
        name: "★Leo4534",
    },
    &ItemMetadata {
        id: 1461,
        name: "★Leo4357",
    },
    &ItemMetadata {
        id: 1462,
        name: "★Leo4057",
    },
    &ItemMetadata {
        id: 1463,
        name: "★Leo4359",
    },
    &ItemMetadata {
        id: 1464,
        name: "★Leo4031",
    },
    &ItemMetadata {
        id: 1465,
        name: "★Leo3852",
    },
    &ItemMetadata {
        id: 1466,
        name: "★Leo3905",
    },
    &ItemMetadata {
        id: 1467,
        name: "★Leo3773",
    },
    &ItemMetadata {
        id: 1468,
        name: "★Gru8425",
    },
    &ItemMetadata {
        id: 1469,
        name: "★Gru8636",
    },
    &ItemMetadata {
        id: 1470,
        name: "★Gru8353",
    },
    &ItemMetadata {
        id: 1471,
        name: "★Lib5685",
    },
    &ItemMetadata {
        id: 1472,
        name: "★Lib5531",
    },
    &ItemMetadata {
        id: 1473,
        name: "★Lib5787",
    },
    &ItemMetadata {
        id: 1474,
        name: "★Lib5603",
    },
    &ItemMetadata {
        id: 1475,
        name: "★Pup3165",
    },
    &ItemMetadata {
        id: 1476,
        name: "★Pup3185",
    },
    &ItemMetadata {
        id: 1477,
        name: "★Pup3045",
    },
    &ItemMetadata {
        id: 1478,
        name: "★Cyg7924",
    },
    &ItemMetadata {
        id: 1479,
        name: "★Cyg7417",
    },
    &ItemMetadata {
        id: 1480,
        name: "★Cyg7796",
    },
    &ItemMetadata {
        id: 1481,
        name: "★Cyg8301",
    },
    &ItemMetadata {
        id: 1482,
        name: "★Cyg7949",
    },
    &ItemMetadata {
        id: 1483,
        name: "★Cyg7528",
    },
    &ItemMetadata {
        id: 1484,
        name: "★Oct7228",
    },
    &ItemMetadata {
        id: 1485,
        name: "★Col1956",
    },
    &ItemMetadata {
        id: 1486,
        name: "★Col2040",
    },
    &ItemMetadata {
        id: 1487,
        name: "★Col2177",
    },
    &ItemMetadata {
        id: 1488,
        name: "★Gem2990",
    },
    &ItemMetadata {
        id: 1489,
        name: "★Gem2891",
    },
    &ItemMetadata {
        id: 1490,
        name: "★Gem2421",
    },
    &ItemMetadata {
        id: 1491,
        name: "★Gem2473",
    },
    &ItemMetadata {
        id: 1492,
        name: "★Gem2216",
    },
    &ItemMetadata {
        id: 1493,
        name: "★Gem2777",
    },
    &ItemMetadata {
        id: 1494,
        name: "★Gem2650",
    },
    &ItemMetadata {
        id: 1495,
        name: "★Gem2286",
    },
    &ItemMetadata {
        id: 1496,
        name: "★Gem2484",
    },
    &ItemMetadata {
        id: 1497,
        name: "★Gem2930",
    },
    &ItemMetadata {
        id: 1498,
        name: "★Peg8775",
    },
    &ItemMetadata {
        id: 1499,
        name: "★Peg8781",
    },
    &ItemMetadata {
        id: 1500,
        name: "★Peg39",
    },
    &ItemMetadata {
        id: 1501,
        name: "★Peg8308",
    },
    &ItemMetadata {
        id: 1502,
        name: "★Peg8650",
    },
    &ItemMetadata {
        id: 1503,
        name: "★Peg8634",
    },
    &ItemMetadata {
        id: 1504,
        name: "★Peg8684",
    },
    &ItemMetadata {
        id: 1505,
        name: "★Peg8450",
    },
    &ItemMetadata {
        id: 1506,
        name: "★Peg8880",
    },
    &ItemMetadata {
        id: 1507,
        name: "★Peg8905",
    },
    &ItemMetadata {
        id: 1508,
        name: "★Oph6556",
    },
    &ItemMetadata {
        id: 1509,
        name: "★Oph6378",
    },
    &ItemMetadata {
        id: 1510,
        name: "★Oph6603",
    },
    &ItemMetadata {
        id: 1511,
        name: "★Oph6149",
    },
    &ItemMetadata {
        id: 1512,
        name: "★Oph6056",
    },
    &ItemMetadata {
        id: 1513,
        name: "★Oph6075",
    },
    &ItemMetadata {
        id: 1514,
        name: "★Ser5854",
    },
    &ItemMetadata {
        id: 1515,
        name: "★Ser7141",
    },
    &ItemMetadata {
        id: 1516,
        name: "★Ser5879",
    },
    &ItemMetadata {
        id: 1517,
        name: "★Her6406",
    },
    &ItemMetadata {
        id: 1518,
        name: "★Her6148",
    },
    &ItemMetadata {
        id: 1519,
        name: "★Her6410",
    },
    &ItemMetadata {
        id: 1520,
        name: "★Her6526",
    },
    &ItemMetadata {
        id: 1521,
        name: "★Her6117",
    },
    &ItemMetadata {
        id: 1522,
        name: "★Her6008",
    },
    &ItemMetadata {
        id: 1523,
        name: "★Per936",
    },
    &ItemMetadata {
        id: 1524,
        name: "★Per1017",
    },
    &ItemMetadata {
        id: 1525,
        name: "★Per1131",
    },
    &ItemMetadata {
        id: 1526,
        name: "★Per1228",
    },
    &ItemMetadata {
        id: 1527,
        name: "★Per834",
    },
    &ItemMetadata {
        id: 1528,
        name: "★Per941",
    },
    &ItemMetadata {
        id: 1529,
        name: "★Phe99",
    },
    &ItemMetadata {
        id: 1530,
        name: "★Phe338",
    },
    &ItemMetadata {
        id: 1531,
        name: "★Vel3634",
    },
    &ItemMetadata {
        id: 1532,
        name: "★Vel3485",
    },
    &ItemMetadata {
        id: 1533,
        name: "★Vel3734",
    },
    &ItemMetadata {
        id: 1534,
        name: "★Aqr8232",
    },
    &ItemMetadata {
        id: 1535,
        name: "★Aqr8414",
    },
    &ItemMetadata {
        id: 1536,
        name: "★Aqr8709",
    },
    &ItemMetadata {
        id: 1537,
        name: "★Aqr8518",
    },
    &ItemMetadata {
        id: 1538,
        name: "★Aqr7950",
    },
    &ItemMetadata {
        id: 1539,
        name: "★Aqr8499",
    },
    &ItemMetadata {
        id: 1540,
        name: "★Aqr8610",
    },
    &ItemMetadata {
        id: 1541,
        name: "★Aqr8264",
    },
    &ItemMetadata {
        id: 1542,
        name: "★Cru4853",
    },
    &ItemMetadata {
        id: 1543,
        name: "★Cru4730",
    },
    &ItemMetadata {
        id: 1544,
        name: "★Cru4763",
    },
    &ItemMetadata {
        id: 1545,
        name: "★Cru4700",
    },
    &ItemMetadata {
        id: 1546,
        name: "★Cru4656",
    },
    &ItemMetadata {
        id: 1547,
        name: "★PsA8728",
    },
    &ItemMetadata {
        id: 1548,
        name: "★TrA6217",
    },
    &ItemMetadata {
        id: 1549,
        name: "★Cap7776",
    },
    &ItemMetadata {
        id: 1550,
        name: "★Cap7754",
    },
    &ItemMetadata {
        id: 1551,
        name: "★Cap8278",
    },
    &ItemMetadata {
        id: 1552,
        name: "★Cap8322",
    },
    &ItemMetadata {
        id: 1553,
        name: "★Cap7773",
    },
    &ItemMetadata {
        id: 1554,
        name: "★Sge7479",
    },
    &ItemMetadata {
        id: 1555,
        name: "★Car2326",
    },
    &ItemMetadata {
        id: 1556,
        name: "★Car3685",
    },
    &ItemMetadata {
        id: 1557,
        name: "★Car3307",
    },
    &ItemMetadata {
        id: 1558,
        name: "★Car3699",
    },
    &ItemMetadata {
        id: 1559,
        name: "★Dra5744",
    },
    &ItemMetadata {
        id: 1560,
        name: "★Dra5291",
    },
    &ItemMetadata {
        id: 1561,
        name: "★Dra6705",
    },
    &ItemMetadata {
        id: 1562,
        name: "★Dra6536",
    },
    &ItemMetadata {
        id: 1563,
        name: "★Dra7310",
    },
    &ItemMetadata {
        id: 1564,
        name: "★Dra6688",
    },
    &ItemMetadata {
        id: 1565,
        name: "★Dra4434",
    },
    &ItemMetadata {
        id: 1566,
        name: "★Dra6370",
    },
    &ItemMetadata {
        id: 1567,
        name: "★Dra7462",
    },
    &ItemMetadata {
        id: 1568,
        name: "★Dra6396",
    },
    &ItemMetadata {
        id: 1569,
        name: "★Dra6132",
    },
    &ItemMetadata {
        id: 1570,
        name: "★Dra6636",
    },
    &ItemMetadata {
        id: 1571,
        name: "★CVn4915",
    },
    &ItemMetadata {
        id: 1572,
        name: "★CVn4785",
    },
    &ItemMetadata {
        id: 1573,
        name: "★CVn4846",
    },
    &ItemMetadata {
        id: 1574,
        name: "★Aql7595",
    },
    &ItemMetadata {
        id: 1575,
        name: "★Aql7557",
    },
    &ItemMetadata {
        id: 1576,
        name: "★Aql7525",
    },
    &ItemMetadata {
        id: 1577,
        name: "★Aql7602",
    },
    &ItemMetadata {
        id: 1578,
        name: "★Aql7235",
    },
    &ItemMetadata {
        id: 1579,
        name: "Max Honey",
    },
    &ItemMetadata {
        id: 1580,
        name: "Max Mushrooms",
    },
    &ItemMetadata {
        id: 1581,
        name: "Galarica Twig",
    },
    &ItemMetadata {
        id: 1582,
        name: "Galarica Cuff",
    },
    &ItemMetadata {
        id: 1583,
        name: "Style Card",
    },
    &ItemMetadata {
        id: 1584,
        name: "Armor Pass",
    },
    &ItemMetadata {
        id: 1585,
        name: "Rotom Bike",
    },
    &ItemMetadata {
        id: 1586,
        name: "Rotom Bike",
    },
    &ItemMetadata {
        id: 1587,
        name: "Exp. Charm",
    },
    &ItemMetadata {
        id: 1588,
        name: "Armorite Ore",
    },
    &ItemMetadata {
        id: 1589,
        name: "Mark Charm",
    },
    &ItemMetadata {
        id: 1590,
        name: "Reins of Unity",
    },
    &ItemMetadata {
        id: 1591,
        name: "Reins of Unity",
    },
    &ItemMetadata {
        id: 1592,
        name: "Galarica Wreath",
    },
    &ItemMetadata {
        id: 1593,
        name: "Legendary Clue 1",
    },
    &ItemMetadata {
        id: 1594,
        name: "Legendary Clue 2",
    },
    &ItemMetadata {
        id: 1595,
        name: "Legendary Clue 3",
    },
    &ItemMetadata {
        id: 1596,
        name: "Legendary Clue?",
    },
    &ItemMetadata {
        id: 1597,
        name: "Crown Pass",
    },
    &ItemMetadata {
        id: 1598,
        name: "Wooden Crown",
    },
    &ItemMetadata {
        id: 1599,
        name: "Radiant Petal",
    },
    &ItemMetadata {
        id: 1600,
        name: "White Mane Hair",
    },
    &ItemMetadata {
        id: 1601,
        name: "Black Mane Hair",
    },
    &ItemMetadata {
        id: 1602,
        name: "Iceroot Carrot",
    },
    &ItemMetadata {
        id: 1603,
        name: "Shaderoot Carrot",
    },
    &ItemMetadata {
        id: 1604,
        name: "Dynite Ore",
    },
    &ItemMetadata {
        id: 1605,
        name: "Carrot Seeds",
    },
    &ItemMetadata {
        id: 1606,
        name: "Ability Patch",
    },
    &ItemMetadata {
        id: 1607,
        name: "Reins of Unity",
    },
    &ItemMetadata {
        id: 1608,
        name: "Time Balm",
    },
    &ItemMetadata {
        id: 1609,
        name: "Space Balm",
    },
    &ItemMetadata {
        id: 1610,
        name: "Mysterious Balm",
    },
    &ItemMetadata {
        id: 1611,
        name: "Linking Cord",
    },
    &ItemMetadata {
        id: 1612,
        name: "Hometown Muffin",
    },
    &ItemMetadata {
        id: 1613,
        name: "Apricorn",
    },
    &ItemMetadata {
        id: 1614,
        name: "Jubilife Muffin",
    },
    &ItemMetadata {
        id: 1615,
        name: "Aux Powerguard",
    },
    &ItemMetadata {
        id: 1616,
        name: "Dire Hit",
    },
    &ItemMetadata {
        id: 1617,
        name: "Choice Dumpling",
    },
    &ItemMetadata {
        id: 1618,
        name: "Twice-Spiced Radish",
    },
    &ItemMetadata {
        id: 1619,
        name: "Swap Snack",
    },
    &ItemMetadata {
        id: 1620,
        name: "Caster Fern",
    },
    &ItemMetadata {
        id: 1621,
        name: "Seed of Mastery",
    },
    &ItemMetadata {
        id: 1622,
        name: "Poké Ball",
    },
    &ItemMetadata {
        id: 1623,
        name: "???",
    },
    &ItemMetadata {
        id: 1624,
        name: "Eternal Ice",
    },
    &ItemMetadata {
        id: 1625,
        name: "Uxie’s Claw",
    },
    &ItemMetadata {
        id: 1626,
        name: "Azelf’s Fang",
    },
    &ItemMetadata {
        id: 1627,
        name: "Mesprit’s Plume",
    },
    &ItemMetadata {
        id: 1628,
        name: "Tumblestone",
    },
    &ItemMetadata {
        id: 1629,
        name: "Celestica Flute",
    },
    &ItemMetadata {
        id: 1630,
        name: "Remedy",
    },
    &ItemMetadata {
        id: 1631,
        name: "Fine Remedy",
    },
    &ItemMetadata {
        id: 1632,
        name: "Dazzling Honey",
    },
    &ItemMetadata {
        id: 1633,
        name: "Hearty Grains",
    },
    &ItemMetadata {
        id: 1634,
        name: "Plump Beans",
    },
    &ItemMetadata {
        id: 1635,
        name: "Springy Mushroom",
    },
    &ItemMetadata {
        id: 1636,
        name: "Crunchy Salt",
    },
    &ItemMetadata {
        id: 1637,
        name: "Wood",
    },
    &ItemMetadata {
        id: 1638,
        name: "King’s Leaf",
    },
    &ItemMetadata {
        id: 1639,
        name: "Marsh Balm",
    },
    &ItemMetadata {
        id: 1640,
        name: "Poké Ball",
    },
    &ItemMetadata {
        id: 1641,
        name: "Great Ball",
    },
    &ItemMetadata {
        id: 1642,
        name: "Ultra Ball",
    },
    &ItemMetadata {
        id: 1643,
        name: "Feather Ball",
    },
    &ItemMetadata {
        id: 1644,
        name: "Pokéshi Doll",
    },
    &ItemMetadata {
        id: 1645,
        name: "???",
    },
    &ItemMetadata {
        id: 1646,
        name: "Smoke Bomb",
    },
    &ItemMetadata {
        id: 1647,
        name: "Scatter Bang",
    },
    &ItemMetadata {
        id: 1648,
        name: "Sticky Glob",
    },
    &ItemMetadata {
        id: 1649,
        name: "Star Piece",
    },
    &ItemMetadata {
        id: 1650,
        name: "Mushroom Cake",
    },
    &ItemMetadata {
        id: 1651,
        name: "Bugwort",
    },
    &ItemMetadata {
        id: 1652,
        name: "Honey Cake",
    },
    &ItemMetadata {
        id: 1653,
        name: "Grain Cake",
    },
    &ItemMetadata {
        id: 1654,
        name: "Bean Cake",
    },
    &ItemMetadata {
        id: 1655,
        name: "Salt Cake",
    },
    &ItemMetadata {
        id: 1656,
        name: "Potion",
    },
    &ItemMetadata {
        id: 1657,
        name: "Super Potion",
    },
    &ItemMetadata {
        id: 1658,
        name: "Hyper Potion",
    },
    &ItemMetadata {
        id: 1659,
        name: "Max Potion",
    },
    &ItemMetadata {
        id: 1660,
        name: "Full Restore",
    },
    &ItemMetadata {
        id: 1661,
        name: "Remedy",
    },
    &ItemMetadata {
        id: 1662,
        name: "Fine Remedy",
    },
    &ItemMetadata {
        id: 1663,
        name: "Superb Remedy",
    },
    &ItemMetadata {
        id: 1664,
        name: "Old Gateau",
    },
    &ItemMetadata {
        id: 1665,
        name: "Jubilife Muffin",
    },
    &ItemMetadata {
        id: 1666,
        name: "Full Heal",
    },
    &ItemMetadata {
        id: 1667,
        name: "Revive",
    },
    &ItemMetadata {
        id: 1668,
        name: "Max Revive",
    },
    &ItemMetadata {
        id: 1669,
        name: "Max Ether",
    },
    &ItemMetadata {
        id: 1670,
        name: "Max Elixir",
    },
    &ItemMetadata {
        id: 1671,
        name: "Stealth Spray",
    },
    &ItemMetadata {
        id: 1672,
        name: "???",
    },
    &ItemMetadata {
        id: 1673,
        name: "Aux Power",
    },
    &ItemMetadata {
        id: 1674,
        name: "Aux Guard",
    },
    &ItemMetadata {
        id: 1675,
        name: "Dire Hit",
    },
    &ItemMetadata {
        id: 1676,
        name: "Aux Evasion",
    },
    &ItemMetadata {
        id: 1677,
        name: "Aux Powerguard",
    },
    &ItemMetadata {
        id: 1678,
        name: "Forest Balm",
    },
    &ItemMetadata {
        id: 1679,
        name: "Iron Chunk",
    },
    &ItemMetadata {
        id: 1680,
        name: "???",
    },
    &ItemMetadata {
        id: 1681,
        name: "Black Tumblestone",
    },
    &ItemMetadata {
        id: 1682,
        name: "Sky Tumblestone",
    },
    &ItemMetadata {
        id: 1683,
        name: "???",
    },
    &ItemMetadata {
        id: 1684,
        name: "Ball of Mud",
    },
    &ItemMetadata {
        id: 1685,
        name: "???",
    },
    &ItemMetadata {
        id: 1686,
        name: "Pop Pod",
    },
    &ItemMetadata {
        id: 1687,
        name: "Sootfoot Root",
    },
    &ItemMetadata {
        id: 1688,
        name: "Spoiled Apricorn",
    },
    &ItemMetadata {
        id: 1689,
        name: "Snowball",
    },
    &ItemMetadata {
        id: 1690,
        name: "Sticky Glob",
    },
    &ItemMetadata {
        id: 1691,
        name: "Black Augurite",
    },
    &ItemMetadata {
        id: 1692,
        name: "Peat Block",
    },
    &ItemMetadata {
        id: 1693,
        name: "Stealth Spray",
    },
    &ItemMetadata {
        id: 1694,
        name: "Medicinal Leek",
    },
    &ItemMetadata {
        id: 1695,
        name: "Vivichoke",
    },
    &ItemMetadata {
        id: 1696,
        name: "Pep-Up Plant",
    },
    &ItemMetadata {
        id: 1697,
        name: "???",
    },
    &ItemMetadata {
        id: 1698,
        name: "???",
    },
    &ItemMetadata {
        id: 1699,
        name: "Tempting Charm B",
    },
    &ItemMetadata {
        id: 1700,
        name: "Tempting Charm P",
    },
    &ItemMetadata {
        id: 1701,
        name: "Swordcap",
    },
    &ItemMetadata {
        id: 1702,
        name: "Iron Barktongue",
    },
    &ItemMetadata {
        id: 1703,
        name: "Doppel Bonnets",
    },
    &ItemMetadata {
        id: 1704,
        name: "Direshroom",
    },
    &ItemMetadata {
        id: 1705,
        name: "Sand Radish",
    },
    &ItemMetadata {
        id: 1706,
        name: "Tempting Charm T",
    },
    &ItemMetadata {
        id: 1707,
        name: "Tempting Charm Y",
    },
    &ItemMetadata {
        id: 1708,
        name: "Candy Truffle",
    },
    &ItemMetadata {
        id: 1709,
        name: "Cake-Lure Base",
    },
    &ItemMetadata {
        id: 1710,
        name: "Poké Ball",
    },
    &ItemMetadata {
        id: 1711,
        name: "Great Ball",
    },
    &ItemMetadata {
        id: 1712,
        name: "Ultra Ball",
    },
    &ItemMetadata {
        id: 1713,
        name: "Feather Ball",
    },
    &ItemMetadata {
        id: 1714,
        name: "???",
    },
    &ItemMetadata {
        id: 1715,
        name: "???",
    },
    &ItemMetadata {
        id: 1716,
        name: "Scatter Bang",
    },
    &ItemMetadata {
        id: 1717,
        name: "Smoke Bomb",
    },
    &ItemMetadata {
        id: 1718,
        name: "???",
    },
    &ItemMetadata {
        id: 1719,
        name: "???",
    },
    &ItemMetadata {
        id: 1720,
        name: "Pokéshi Doll",
    },
    &ItemMetadata {
        id: 1721,
        name: "Volcano Balm",
    },
    &ItemMetadata {
        id: 1722,
        name: "Mountain Balm",
    },
    &ItemMetadata {
        id: 1723,
        name: "Snow Balm",
    },
    &ItemMetadata {
        id: 1724,
        name: "Honey Cake",
    },
    &ItemMetadata {
        id: 1725,
        name: "Grain Cake",
    },
    &ItemMetadata {
        id: 1726,
        name: "Bean Cake",
    },
    &ItemMetadata {
        id: 1727,
        name: "Mushroom Cake",
    },
    &ItemMetadata {
        id: 1728,
        name: "Salt Cake",
    },
    &ItemMetadata {
        id: 1729,
        name: "Swap Snack",
    },
    &ItemMetadata {
        id: 1730,
        name: "Choice Dumpling",
    },
    &ItemMetadata {
        id: 1731,
        name: "Twice-Spiced Radish",
    },
    &ItemMetadata {
        id: 1732,
        name: "Survival Charm R",
    },
    &ItemMetadata {
        id: 1733,
        name: "Survival Charm B",
    },
    &ItemMetadata {
        id: 1734,
        name: "Survival Charm P",
    },
    &ItemMetadata {
        id: 1735,
        name: "Survival Charm T",
    },
    &ItemMetadata {
        id: 1736,
        name: "Survival Charm Y",
    },
    &ItemMetadata {
        id: 1737,
        name: "Torn Journal",
    },
    &ItemMetadata {
        id: 1738,
        name: "Warding Charm R",
    },
    &ItemMetadata {
        id: 1739,
        name: "Warding Charm B",
    },
    &ItemMetadata {
        id: 1740,
        name: "Warding Charm P",
    },
    &ItemMetadata {
        id: 1741,
        name: "Warding Charm T",
    },
    &ItemMetadata {
        id: 1742,
        name: "Warding Charm Y",
    },
    &ItemMetadata {
        id: 1743,
        name: "Wall Fragment",
    },
    &ItemMetadata {
        id: 1744,
        name: "Basculegion Food",
    },
    &ItemMetadata {
        id: 1745,
        name: "Old Journal",
    },
    &ItemMetadata {
        id: 1746,
        name: "Wing Ball",
    },
    &ItemMetadata {
        id: 1747,
        name: "Jet Ball",
    },
    &ItemMetadata {
        id: 1748,
        name: "Heavy Ball",
    },
    &ItemMetadata {
        id: 1749,
        name: "Leaden Ball",
    },
    &ItemMetadata {
        id: 1750,
        name: "Gigaton Ball",
    },
    &ItemMetadata {
        id: 1751,
        name: "Wing Ball",
    },
    &ItemMetadata {
        id: 1752,
        name: "Jet Ball",
    },
    &ItemMetadata {
        id: 1753,
        name: "Heavy Ball",
    },
    &ItemMetadata {
        id: 1754,
        name: "Hopo Berry",
    },
    &ItemMetadata {
        id: 1755,
        name: "Superb Remedy",
    },
    &ItemMetadata {
        id: 1756,
        name: "Aux Power",
    },
    &ItemMetadata {
        id: 1757,
        name: "Aux Guard",
    },
    &ItemMetadata {
        id: 1758,
        name: "Aux Evasion",
    },
    &ItemMetadata {
        id: 1759,
        name: "Grit Dust",
    },
    &ItemMetadata {
        id: 1760,
        name: "Grit Gravel",
    },
    &ItemMetadata {
        id: 1761,
        name: "Grit Pebble",
    },
    &ItemMetadata {
        id: 1762,
        name: "Grit Rock",
    },
    &ItemMetadata {
        id: 1763,
        name: "Secret Medicine",
    },
    &ItemMetadata {
        id: 1764,
        name: "Tempting Charm R",
    },
    &ItemMetadata {
        id: 1765,
        name: "Lost Satchel",
    },
    &ItemMetadata {
        id: 1766,
        name: "Lost Satchel",
    },
    &ItemMetadata {
        id: 1767,
        name: "Lost Satchel",
    },
    &ItemMetadata {
        id: 1768,
        name: "Lost Satchel",
    },
    &ItemMetadata {
        id: 1769,
        name: "Lost Satchel",
    },
    &ItemMetadata {
        id: 1770,
        name: "???",
    },
    &ItemMetadata {
        id: 1771,
        name: "Origin Ball",
    },
    &ItemMetadata {
        id: 1772,
        name: "???",
    },
    &ItemMetadata {
        id: 1773,
        name: "???",
    },
    &ItemMetadata {
        id: 1774,
        name: "???",
    },
    &ItemMetadata {
        id: 1775,
        name: "???",
    },
    &ItemMetadata {
        id: 1776,
        name: "Origin Ore",
    },
    &ItemMetadata {
        id: 1777,
        name: "Adamant Crystal",
    },
    &ItemMetadata {
        id: 1778,
        name: "Lustrous Globe",
    },
    &ItemMetadata {
        id: 1779,
        name: "Griseous Core",
    },
    &ItemMetadata {
        id: 1780,
        name: "Blank Plate",
    },
    &ItemMetadata {
        id: 1781,
        name: "???",
    },
    &ItemMetadata {
        id: 1782,
        name: "Crafting Kit",
    },
    &ItemMetadata {
        id: 1783,
        name: "Leaden Ball",
    },
    &ItemMetadata {
        id: 1784,
        name: "Gigaton Ball",
    },
    &ItemMetadata {
        id: 1785,
        name: "Strange Ball",
    },
    &ItemMetadata {
        id: 1786,
        name: "Pokédex",
    },
    &ItemMetadata {
        id: 1787,
        name: "Old Verse 1",
    },
    &ItemMetadata {
        id: 1788,
        name: "Old Verse 2",
    },
    &ItemMetadata {
        id: 1789,
        name: "Old Verse 3",
    },
    &ItemMetadata {
        id: 1790,
        name: "Old Verse 4",
    },
    &ItemMetadata {
        id: 1791,
        name: "???",
    },
    &ItemMetadata {
        id: 1792,
        name: "Old Verse 5",
    },
    &ItemMetadata {
        id: 1793,
        name: "Old Verse 6",
    },
    &ItemMetadata {
        id: 1794,
        name: "Old Verse 7",
    },
    &ItemMetadata {
        id: 1795,
        name: "Old Verse 8",
    },
    &ItemMetadata {
        id: 1796,
        name: "Old Verse 9",
    },
    &ItemMetadata {
        id: 1797,
        name: "Old Verse 10",
    },
    &ItemMetadata {
        id: 1798,
        name: "Old Verse 11",
    },
    &ItemMetadata {
        id: 1799,
        name: "Old Verse 12",
    },
    &ItemMetadata {
        id: 1800,
        name: "Old Verse 13",
    },
    &ItemMetadata {
        id: 1801,
        name: "Old Verse 14",
    },
    &ItemMetadata {
        id: 1802,
        name: "Old Verse 15",
    },
    &ItemMetadata {
        id: 1803,
        name: "Old Verse 16",
    },
    &ItemMetadata {
        id: 1804,
        name: "Old Verse 17",
    },
    &ItemMetadata {
        id: 1805,
        name: "Old Verse 18",
    },
    &ItemMetadata {
        id: 1806,
        name: "Old Verse 19",
    },
    &ItemMetadata {
        id: 1807,
        name: "Old Verse 20",
    },
    &ItemMetadata {
        id: 1808,
        name: "Mysterious Shard S",
    },
    &ItemMetadata {
        id: 1809,
        name: "Mysterious Shard L",
    },
    &ItemMetadata {
        id: 1810,
        name: "Digger Drill",
    },
    &ItemMetadata {
        id: 1811,
        name: "Kanto Slate",
    },
    &ItemMetadata {
        id: 1812,
        name: "Johto Slate",
    },
    &ItemMetadata {
        id: 1813,
        name: "Soul Slate",
    },
    &ItemMetadata {
        id: 1814,
        name: "Rainbow Slate",
    },
    &ItemMetadata {
        id: 1815,
        name: "Squall Slate",
    },
    &ItemMetadata {
        id: 1816,
        name: "Oceanic Slate",
    },
    &ItemMetadata {
        id: 1817,
        name: "Tectonic Slate",
    },
    &ItemMetadata {
        id: 1818,
        name: "Stratospheric Slate",
    },
    &ItemMetadata {
        id: 1819,
        name: "Genome Slate",
    },
    &ItemMetadata {
        id: 1820,
        name: "Discovery Slate",
    },
    &ItemMetadata {
        id: 1821,
        name: "Distortion Slate",
    },
    &ItemMetadata {
        id: 1822,
        name: "DS Sounds",
    },
    &ItemMetadata { id: 1823, name: "" },
    &ItemMetadata { id: 1824, name: "" },
    &ItemMetadata { id: 1825, name: "" },
    &ItemMetadata { id: 1826, name: "" },
    &ItemMetadata { id: 1827, name: "" },
    &ItemMetadata {
        id: 1828,
        name: "Legend Plate",
    },
    &ItemMetadata {
        id: 1829,
        name: "Rotom Phone",
    },
    &ItemMetadata {
        id: 1830,
        name: "Sandwich",
    },
    &ItemMetadata {
        id: 1831,
        name: "Koraidon’s Poké Ball",
    },
    &ItemMetadata {
        id: 1832,
        name: "Miraidon’s Poké Ball",
    },
    &ItemMetadata {
        id: 1833,
        name: "Tera Orb",
    },
    &ItemMetadata {
        id: 1834,
        name: "Scarlet Book",
    },
    &ItemMetadata {
        id: 1835,
        name: "Violet Book",
    },
    &ItemMetadata {
        id: 1836,
        name: "Kofu’s Wallet",
    },
    &ItemMetadata { id: 1837, name: "" },
    &ItemMetadata { id: 1838, name: "" },
    &ItemMetadata { id: 1839, name: "" },
    &ItemMetadata { id: 1840, name: "" },
    &ItemMetadata { id: 1841, name: "" },
    &ItemMetadata {
        id: 1842,
        name: "Tiny Bamboo Shoot",
    },
    &ItemMetadata {
        id: 1843,
        name: "Big Bamboo Shoot",
    },
    &ItemMetadata { id: 1844, name: "" },
    &ItemMetadata { id: 1845, name: "" },
    &ItemMetadata { id: 1846, name: "" },
    &ItemMetadata { id: 1847, name: "" },
    &ItemMetadata { id: 1848, name: "" },
    &ItemMetadata { id: 1849, name: "" },
    &ItemMetadata { id: 1850, name: "" },
    &ItemMetadata { id: 1851, name: "" },
    &ItemMetadata { id: 1852, name: "" },
    &ItemMetadata { id: 1853, name: "" },
    &ItemMetadata { id: 1854, name: "" },
    &ItemMetadata { id: 1855, name: "" },
    &ItemMetadata { id: 1856, name: "" },
    &ItemMetadata {
        id: 1857,
        name: "Scroll of Darkness",
    },
    &ItemMetadata {
        id: 1858,
        name: "Scroll of Waters",
    },
    &ItemMetadata { id: 1859, name: "" },
    &ItemMetadata { id: 1860, name: "" },
    &ItemMetadata {
        id: 1861,
        name: "Malicious Armor",
    },
    &ItemMetadata {
        id: 1862,
        name: "Normal Tera Shard",
    },
    &ItemMetadata {
        id: 1863,
        name: "Fire Tera Shard",
    },
    &ItemMetadata {
        id: 1864,
        name: "Water Tera Shard",
    },
    &ItemMetadata {
        id: 1865,
        name: "Electric Tera Shard",
    },
    &ItemMetadata {
        id: 1866,
        name: "Grass Tera Shard",
    },
    &ItemMetadata {
        id: 1867,
        name: "Ice Tera Shard",
    },
    &ItemMetadata {
        id: 1868,
        name: "Fighting Tera Shard",
    },
    &ItemMetadata {
        id: 1869,
        name: "Poison Tera Shard",
    },
    &ItemMetadata {
        id: 1870,
        name: "Ground Tera Shard",
    },
    &ItemMetadata {
        id: 1871,
        name: "Flying Tera Shard",
    },
    &ItemMetadata {
        id: 1872,
        name: "Psychic Tera Shard",
    },
    &ItemMetadata {
        id: 1873,
        name: "Bug Tera Shard",
    },
    &ItemMetadata {
        id: 1874,
        name: "Rock Tera Shard",
    },
    &ItemMetadata {
        id: 1875,
        name: "Ghost Tera Shard",
    },
    &ItemMetadata {
        id: 1876,
        name: "Dragon Tera Shard",
    },
    &ItemMetadata {
        id: 1877,
        name: "Dark Tera Shard",
    },
    &ItemMetadata {
        id: 1878,
        name: "Steel Tera Shard",
    },
    &ItemMetadata {
        id: 1879,
        name: "Fairy Tera Shard",
    },
    &ItemMetadata {
        id: 1880,
        name: "Booster Energy",
    },
    &ItemMetadata {
        id: 1881,
        name: "Ability Shield",
    },
    &ItemMetadata {
        id: 1882,
        name: "Clear Amulet",
    },
    &ItemMetadata {
        id: 1883,
        name: "Mirror Herb",
    },
    &ItemMetadata {
        id: 1884,
        name: "Punching Glove",
    },
    &ItemMetadata {
        id: 1885,
        name: "Covert Cloak",
    },
    &ItemMetadata {
        id: 1886,
        name: "Loaded Dice",
    },
    &ItemMetadata { id: 1887, name: "" },
    &ItemMetadata {
        id: 1888,
        name: "Baguette",
    },
    &ItemMetadata {
        id: 1889,
        name: "Mayonnaise",
    },
    &ItemMetadata {
        id: 1890,
        name: "Ketchup",
    },
    &ItemMetadata {
        id: 1891,
        name: "Mustard",
    },
    &ItemMetadata {
        id: 1892,
        name: "Butter",
    },
    &ItemMetadata {
        id: 1893,
        name: "Peanut Butter",
    },
    &ItemMetadata {
        id: 1894,
        name: "Chili Sauce",
    },
    &ItemMetadata {
        id: 1895,
        name: "Salt",
    },
    &ItemMetadata {
        id: 1896,
        name: "Pepper",
    },
    &ItemMetadata {
        id: 1897,
        name: "Yogurt",
    },
    &ItemMetadata {
        id: 1898,
        name: "Whipped Cream",
    },
    &ItemMetadata {
        id: 1899,
        name: "Cream Cheese",
    },
    &ItemMetadata {
        id: 1900,
        name: "Jam",
    },
    &ItemMetadata {
        id: 1901,
        name: "Marmalade",
    },
    &ItemMetadata {
        id: 1902,
        name: "Olive Oil",
    },
    &ItemMetadata {
        id: 1903,
        name: "Vinegar",
    },
    &ItemMetadata {
        id: 1904,
        name: "Sweet Herba Mystica",
    },
    &ItemMetadata {
        id: 1905,
        name: "Salty Herba Mystica",
    },
    &ItemMetadata {
        id: 1906,
        name: "Sour Herba Mystica",
    },
    &ItemMetadata {
        id: 1907,
        name: "Bitter Herba Mystica",
    },
    &ItemMetadata {
        id: 1908,
        name: "Spicy Herba Mystica",
    },
    &ItemMetadata {
        id: 1909,
        name: "Lettuce",
    },
    &ItemMetadata {
        id: 1910,
        name: "Tomato",
    },
    &ItemMetadata {
        id: 1911,
        name: "Cherry Tomatoes",
    },
    &ItemMetadata {
        id: 1912,
        name: "Cucumber",
    },
    &ItemMetadata {
        id: 1913,
        name: "Pickle",
    },
    &ItemMetadata {
        id: 1914,
        name: "Onion",
    },
    &ItemMetadata {
        id: 1915,
        name: "Red Onion",
    },
    &ItemMetadata {
        id: 1916,
        name: "Green Bell Pepper",
    },
    &ItemMetadata {
        id: 1917,
        name: "Red Bell Pepper",
    },
    &ItemMetadata {
        id: 1918,
        name: "Yellow Bell Pepper",
    },
    &ItemMetadata {
        id: 1919,
        name: "Avocado",
    },
    &ItemMetadata {
        id: 1920,
        name: "Bacon",
    },
    &ItemMetadata {
        id: 1921,
        name: "Ham",
    },
    &ItemMetadata {
        id: 1922,
        name: "Prosciutto",
    },
    &ItemMetadata {
        id: 1923,
        name: "Chorizo",
    },
    &ItemMetadata {
        id: 1924,
        name: "Herbed Sausage",
    },
    &ItemMetadata {
        id: 1925,
        name: "Hamburger",
    },
    &ItemMetadata {
        id: 1926,
        name: "Klawf Stick",
    },
    &ItemMetadata {
        id: 1927,
        name: "Smoked Fillet",
    },
    &ItemMetadata {
        id: 1928,
        name: "Fried Fillet",
    },
    &ItemMetadata {
        id: 1929,
        name: "Egg",
    },
    &ItemMetadata {
        id: 1930,
        name: "Potato Tortilla",
    },
    &ItemMetadata {
        id: 1931,
        name: "Tofu",
    },
    &ItemMetadata {
        id: 1932,
        name: "Rice",
    },
    &ItemMetadata {
        id: 1933,
        name: "Noodles",
    },
    &ItemMetadata {
        id: 1934,
        name: "Potato Salad",
    },
    &ItemMetadata {
        id: 1935,
        name: "Cheese",
    },
    &ItemMetadata {
        id: 1936,
        name: "Banana",
    },
    &ItemMetadata {
        id: 1937,
        name: "Strawberry",
    },
    &ItemMetadata {
        id: 1938,
        name: "Apple",
    },
    &ItemMetadata {
        id: 1939,
        name: "Kiwi",
    },
    &ItemMetadata {
        id: 1940,
        name: "Pineapple",
    },
    &ItemMetadata {
        id: 1941,
        name: "Jalapeño",
    },
    &ItemMetadata {
        id: 1942,
        name: "Horseradish",
    },
    &ItemMetadata {
        id: 1943,
        name: "Curry Powder",
    },
    &ItemMetadata {
        id: 1944,
        name: "Wasabi",
    },
    &ItemMetadata {
        id: 1945,
        name: "Watercress",
    },
    &ItemMetadata {
        id: 1946,
        name: "Basil",
    },
    &ItemMetadata { id: 1947, name: "" },
    &ItemMetadata { id: 1948, name: "" },
    &ItemMetadata { id: 1949, name: "" },
    &ItemMetadata { id: 1950, name: "" },
    &ItemMetadata { id: 1951, name: "" },
    &ItemMetadata { id: 1952, name: "" },
    &ItemMetadata { id: 1953, name: "" },
    &ItemMetadata { id: 1954, name: "" },
    &ItemMetadata { id: 1955, name: "" },
    &ItemMetadata {
        id: 1956,
        name: "Venonat Fang",
    },
    &ItemMetadata {
        id: 1957,
        name: "Diglett Dirt",
    },
    &ItemMetadata {
        id: 1958,
        name: "Meowth Fur",
    },
    &ItemMetadata {
        id: 1959,
        name: "Psyduck Down",
    },
    &ItemMetadata {
        id: 1960,
        name: "Mankey Fur",
    },
    &ItemMetadata {
        id: 1961,
        name: "Growlithe Fur",
    },
    &ItemMetadata {
        id: 1962,
        name: "Slowpoke Claw",
    },
    &ItemMetadata {
        id: 1963,
        name: "Magnemite Screw",
    },
    &ItemMetadata {
        id: 1964,
        name: "Grimer Toxin",
    },
    &ItemMetadata {
        id: 1965,
        name: "Shellder Pearl",
    },
    &ItemMetadata {
        id: 1966,
        name: "Gastly Gas",
    },
    &ItemMetadata {
        id: 1967,
        name: "Drowzee Fur",
    },
    &ItemMetadata {
        id: 1968,
        name: "Voltorb Sparks",
    },
    &ItemMetadata {
        id: 1969,
        name: "Scyther Claw",
    },
    &ItemMetadata {
        id: 1970,
        name: "Tauros Hair",
    },
    &ItemMetadata {
        id: 1971,
        name: "Magikarp Scales",
    },
    &ItemMetadata {
        id: 1972,
        name: "Ditto Goo",
    },
    &ItemMetadata {
        id: 1973,
        name: "Eevee Fur",
    },
    &ItemMetadata {
        id: 1974,
        name: "Dratini Scales",
    },
    &ItemMetadata {
        id: 1975,
        name: "Pichu Fur",
    },
    &ItemMetadata {
        id: 1976,
        name: "Igglybuff Fluff",
    },
    &ItemMetadata {
        id: 1977,
        name: "Mareep Wool",
    },
    &ItemMetadata {
        id: 1978,
        name: "Hoppip Leaf",
    },
    &ItemMetadata {
        id: 1979,
        name: "Sunkern Leaf",
    },
    &ItemMetadata {
        id: 1980,
        name: "Murkrow Bauble",
    },
    &ItemMetadata {
        id: 1981,
        name: "Misdreavus Tears",
    },
    &ItemMetadata {
        id: 1982,
        name: "Girafarig Fur",
    },
    &ItemMetadata {
        id: 1983,
        name: "Pineco Husk",
    },
    &ItemMetadata {
        id: 1984,
        name: "Dunsparce Scales",
    },
    &ItemMetadata {
        id: 1985,
        name: "Qwilfish Spines",
    },
    &ItemMetadata {
        id: 1986,
        name: "Heracross Claw",
    },
    &ItemMetadata {
        id: 1987,
        name: "Sneasel Claw",
    },
    &ItemMetadata {
        id: 1988,
        name: "Teddiursa Claw",
    },
    &ItemMetadata {
        id: 1989,
        name: "Delibird Parcel",
    },
    &ItemMetadata {
        id: 1990,
        name: "Houndour Fang",
    },
    &ItemMetadata {
        id: 1991,
        name: "Phanpy Nail",
    },
    &ItemMetadata {
        id: 1992,
        name: "Stantler Hair",
    },
    &ItemMetadata {
        id: 1993,
        name: "Larvitar Claw",
    },
    &ItemMetadata {
        id: 1994,
        name: "Wingull Feather",
    },
    &ItemMetadata {
        id: 1995,
        name: "Ralts Dust",
    },
    &ItemMetadata {
        id: 1996,
        name: "Surskit Syrup",
    },
    &ItemMetadata {
        id: 1997,
        name: "Shroomish Spores",
    },
    &ItemMetadata {
        id: 1998,
        name: "Slakoth Fur",
    },
    &ItemMetadata {
        id: 1999,
        name: "Makuhita Sweat",
    },
    &ItemMetadata {
        id: 2000,
        name: "Azurill Fur",
    },
    &ItemMetadata {
        id: 2001,
        name: "Sableye Gem",
    },
    &ItemMetadata {
        id: 2002,
        name: "Meditite Sweat",
    },
    &ItemMetadata {
        id: 2003,
        name: "Gulpin Mucus",
    },
    &ItemMetadata {
        id: 2004,
        name: "Numel Lava",
    },
    &ItemMetadata {
        id: 2005,
        name: "Torkoal Coal",
    },
    &ItemMetadata {
        id: 2006,
        name: "Spoink Pearl",
    },
    &ItemMetadata {
        id: 2007,
        name: "Cacnea Needle",
    },
    &ItemMetadata {
        id: 2008,
        name: "Swablu Fluff",
    },
    &ItemMetadata {
        id: 2009,
        name: "Zangoose Claw",
    },
    &ItemMetadata {
        id: 2010,
        name: "Seviper Fang",
    },
    &ItemMetadata {
        id: 2011,
        name: "Barboach Slime",
    },
    &ItemMetadata {
        id: 2012,
        name: "Shuppet Scrap",
    },
    &ItemMetadata {
        id: 2013,
        name: "Tropius Leaf",
    },
    &ItemMetadata {
        id: 2014,
        name: "Snorunt Fur",
    },
    &ItemMetadata {
        id: 2015,
        name: "Luvdisc Scales",
    },
    &ItemMetadata {
        id: 2016,
        name: "Bagon Scales",
    },
    &ItemMetadata {
        id: 2017,
        name: "Starly Feather",
    },
    &ItemMetadata {
        id: 2018,
        name: "Kricketot Shell",
    },
    &ItemMetadata {
        id: 2019,
        name: "Shinx Fang",
    },
    &ItemMetadata {
        id: 2020,
        name: "Combee Honey",
    },
    &ItemMetadata {
        id: 2021,
        name: "Pachirisu Fur",
    },
    &ItemMetadata {
        id: 2022,
        name: "Buizel Fur",
    },
    &ItemMetadata {
        id: 2023,
        name: "Shellos Mucus",
    },
    &ItemMetadata {
        id: 2024,
        name: "Drifloon Gas",
    },
    &ItemMetadata {
        id: 2025,
        name: "Stunky Fur",
    },
    &ItemMetadata {
        id: 2026,
        name: "Bronzor Fragment",
    },
    &ItemMetadata {
        id: 2027,
        name: "Bonsly Tears",
    },
    &ItemMetadata {
        id: 2028,
        name: "Happiny Dust",
    },
    &ItemMetadata {
        id: 2029,
        name: "Spiritomb Fragment",
    },
    &ItemMetadata {
        id: 2030,
        name: "Gible Scales",
    },
    &ItemMetadata {
        id: 2031,
        name: "Riolu Fur",
    },
    &ItemMetadata {
        id: 2032,
        name: "Hippopotas Sand",
    },
    &ItemMetadata {
        id: 2033,
        name: "Croagunk Poison",
    },
    &ItemMetadata {
        id: 2034,
        name: "Finneon Scales",
    },
    &ItemMetadata {
        id: 2035,
        name: "Snover Berries",
    },
    &ItemMetadata {
        id: 2036,
        name: "Rotom Sparks",
    },
    &ItemMetadata {
        id: 2037,
        name: "Petilil Leaf",
    },
    &ItemMetadata {
        id: 2038,
        name: "Basculin Fang",
    },
    &ItemMetadata {
        id: 2039,
        name: "Sandile Claw",
    },
    &ItemMetadata {
        id: 2040,
        name: "Zorua Fur",
    },
    &ItemMetadata {
        id: 2041,
        name: "Gothita Eyelash",
    },
    &ItemMetadata {
        id: 2042,
        name: "Deerling Hair",
    },
    &ItemMetadata {
        id: 2043,
        name: "Foongus Spores",
    },
    &ItemMetadata {
        id: 2044,
        name: "Alomomola Mucus",
    },
    &ItemMetadata {
        id: 2045,
        name: "Tynamo Slime",
    },
    &ItemMetadata {
        id: 2046,
        name: "Axew Scales",
    },
    &ItemMetadata {
        id: 2047,
        name: "Cubchoo Fur",
    },
    &ItemMetadata {
        id: 2048,
        name: "Cryogonal Ice",
    },
    &ItemMetadata {
        id: 2049,
        name: "Pawniard Blade",
    },
    &ItemMetadata {
        id: 2050,
        name: "Rufflet Feather",
    },
    &ItemMetadata {
        id: 2051,
        name: "Deino Scales",
    },
    &ItemMetadata {
        id: 2052,
        name: "Larvesta Fuzz",
    },
    &ItemMetadata {
        id: 2053,
        name: "Fletchling Feather",
    },
    &ItemMetadata {
        id: 2054,
        name: "Scatterbug Powder",
    },
    &ItemMetadata {
        id: 2055,
        name: "Litleo Tuft",
    },
    &ItemMetadata {
        id: 2056,
        name: "Flabébé Pollen",
    },
    &ItemMetadata {
        id: 2057,
        name: "Skiddo Leaf",
    },
    &ItemMetadata {
        id: 2058,
        name: "Skrelp Kelp",
    },
    &ItemMetadata {
        id: 2059,
        name: "Clauncher Claw",
    },
    &ItemMetadata {
        id: 2060,
        name: "Hawlucha Down",
    },
    &ItemMetadata {
        id: 2061,
        name: "Dedenne Fur",
    },
    &ItemMetadata {
        id: 2062,
        name: "Goomy Goo",
    },
    &ItemMetadata {
        id: 2063,
        name: "Klefki Key",
    },
    &ItemMetadata {
        id: 2064,
        name: "Bergmite Ice",
    },
    &ItemMetadata {
        id: 2065,
        name: "Noibat Fur",
    },
    &ItemMetadata {
        id: 2066,
        name: "Yungoos Fur",
    },
    &ItemMetadata {
        id: 2067,
        name: "Crabrawler Shell",
    },
    &ItemMetadata {
        id: 2068,
        name: "Oricorio Feather",
    },
    &ItemMetadata {
        id: 2069,
        name: "Rockruff Rock",
    },
    &ItemMetadata {
        id: 2070,
        name: "Mareanie Spike",
    },
    &ItemMetadata {
        id: 2071,
        name: "Mudbray Mud",
    },
    &ItemMetadata {
        id: 2072,
        name: "Fomantis Leaf",
    },
    &ItemMetadata {
        id: 2073,
        name: "Salandit Gas",
    },
    &ItemMetadata {
        id: 2074,
        name: "Bounsweet Sweat",
    },
    &ItemMetadata {
        id: 2075,
        name: "Oranguru Fur",
    },
    &ItemMetadata {
        id: 2076,
        name: "Passimian Fur",
    },
    &ItemMetadata {
        id: 2077,
        name: "Sandygast Sand",
    },
    &ItemMetadata {
        id: 2078,
        name: "Komala Claw",
    },
    &ItemMetadata {
        id: 2079,
        name: "Mimikyu Scrap",
    },
    &ItemMetadata {
        id: 2080,
        name: "Bruxish Tooth",
    },
    &ItemMetadata {
        id: 2081,
        name: "Chewtle Claw",
    },
    &ItemMetadata {
        id: 2082,
        name: "Skwovet Fur",
    },
    &ItemMetadata {
        id: 2083,
        name: "Arrokuda Scales",
    },
    &ItemMetadata {
        id: 2084,
        name: "Rookidee Feather",
    },
    &ItemMetadata {
        id: 2085,
        name: "Toxel Sparks",
    },
    &ItemMetadata {
        id: 2086,
        name: "Falinks Sweat",
    },
    &ItemMetadata {
        id: 2087,
        name: "Cufant Tarnish",
    },
    &ItemMetadata {
        id: 2088,
        name: "Rolycoly Coal",
    },
    &ItemMetadata {
        id: 2089,
        name: "Silicobra Sand",
    },
    &ItemMetadata {
        id: 2090,
        name: "Indeedee Fur",
    },
    &ItemMetadata {
        id: 2091,
        name: "Pincurchin Spines",
    },
    &ItemMetadata {
        id: 2092,
        name: "Snom Thread",
    },
    &ItemMetadata {
        id: 2093,
        name: "Impidimp Hair",
    },
    &ItemMetadata {
        id: 2094,
        name: "Applin Juice",
    },
    &ItemMetadata {
        id: 2095,
        name: "Sinistea Chip",
    },
    &ItemMetadata {
        id: 2096,
        name: "Hatenna Dust",
    },
    &ItemMetadata {
        id: 2097,
        name: "Stonjourner Stone",
    },
    &ItemMetadata {
        id: 2098,
        name: "Eiscue Down",
    },
    &ItemMetadata {
        id: 2099,
        name: "Dreepy Powder",
    },
    &ItemMetadata { id: 2100, name: "" },
    &ItemMetadata { id: 2101, name: "" },
    &ItemMetadata { id: 2102, name: "" },
    &ItemMetadata {
        id: 2103,
        name: "Lechonk Hair",
    },
    &ItemMetadata {
        id: 2104,
        name: "Tarountula Thread",
    },
    &ItemMetadata {
        id: 2105,
        name: "Nymble Claw",
    },
    &ItemMetadata {
        id: 2106,
        name: "Rellor Mud",
    },
    &ItemMetadata {
        id: 2107,
        name: "Greavard Wax",
    },
    &ItemMetadata {
        id: 2108,
        name: "Flittle Down",
    },
    &ItemMetadata {
        id: 2109,
        name: "Wiglett Sand",
    },
    &ItemMetadata {
        id: 2110,
        name: "Dondozo Whisker",
    },
    &ItemMetadata {
        id: 2111,
        name: "Veluza Fillet",
    },
    &ItemMetadata {
        id: 2112,
        name: "Finizen Mucus",
    },
    &ItemMetadata {
        id: 2113,
        name: "Smoliv Oil",
    },
    &ItemMetadata {
        id: 2114,
        name: "Capsakid Seed",
    },
    &ItemMetadata {
        id: 2115,
        name: "Tadbulb Mucus",
    },
    &ItemMetadata {
        id: 2116,
        name: "Varoom Fume",
    },
    &ItemMetadata {
        id: 2117,
        name: "Orthworm Tarnish",
    },
    &ItemMetadata {
        id: 2118,
        name: "Tandemaus Fur",
    },
    &ItemMetadata {
        id: 2119,
        name: "Cetoddle Grease",
    },
    &ItemMetadata {
        id: 2120,
        name: "Frigibax Scales",
    },
    &ItemMetadata {
        id: 2121,
        name: "Tatsugiri Scales",
    },
    &ItemMetadata {
        id: 2122,
        name: "Cyclizar Scales",
    },
    &ItemMetadata {
        id: 2123,
        name: "Pawmi Fur",
    },
    &ItemMetadata { id: 2124, name: "" },
    &ItemMetadata { id: 2125, name: "" },
    &ItemMetadata {
        id: 2126,
        name: "Wattrel Feather",
    },
    &ItemMetadata {
        id: 2127,
        name: "Bombirdier Feather",
    },
    &ItemMetadata {
        id: 2128,
        name: "Squawkabilly Feather",
    },
    &ItemMetadata {
        id: 2129,
        name: "Flamigo Down",
    },
    &ItemMetadata {
        id: 2130,
        name: "Klawf Claw",
    },
    &ItemMetadata {
        id: 2131,
        name: "Nacli Salt",
    },
    &ItemMetadata {
        id: 2132,
        name: "Glimmet Crystal",
    },
    &ItemMetadata {
        id: 2133,
        name: "Shroodle Ink",
    },
    &ItemMetadata {
        id: 2134,
        name: "Fidough Fur",
    },
    &ItemMetadata {
        id: 2135,
        name: "Maschiff Fang",
    },
    &ItemMetadata {
        id: 2136,
        name: "Bramblin Twig",
    },
    &ItemMetadata {
        id: 2137,
        name: "Gimmighoul Coin",
    },
    &ItemMetadata { id: 2138, name: "" },
    &ItemMetadata { id: 2139, name: "" },
    &ItemMetadata { id: 2140, name: "" },
    &ItemMetadata { id: 2141, name: "" },
    &ItemMetadata { id: 2142, name: "" },
    &ItemMetadata { id: 2143, name: "" },
    &ItemMetadata { id: 2144, name: "" },
    &ItemMetadata { id: 2145, name: "" },
    &ItemMetadata { id: 2146, name: "" },
    &ItemMetadata { id: 2147, name: "" },
    &ItemMetadata { id: 2148, name: "" },
    &ItemMetadata { id: 2149, name: "" },
    &ItemMetadata { id: 2150, name: "" },
    &ItemMetadata { id: 2151, name: "" },
    &ItemMetadata { id: 2152, name: "" },
    &ItemMetadata { id: 2153, name: "" },
    &ItemMetadata { id: 2154, name: "" },
    &ItemMetadata { id: 2155, name: "" },
    &ItemMetadata {
        id: 2156,
        name: "Tinkatink Hair",
    },
    &ItemMetadata {
        id: 2157,
        name: "Charcadet Soot",
    },
    &ItemMetadata {
        id: 2158,
        name: "Toedscool Flaps",
    },
    &ItemMetadata {
        id: 2159,
        name: "Wooper Slime",
    },
    &ItemMetadata {
        id: 2160,
        name: "TM100",
    },
    &ItemMetadata {
        id: 2161,
        name: "TM101",
    },
    &ItemMetadata {
        id: 2162,
        name: "TM102",
    },
    &ItemMetadata {
        id: 2163,
        name: "TM103",
    },
    &ItemMetadata {
        id: 2164,
        name: "TM104",
    },
    &ItemMetadata {
        id: 2165,
        name: "TM105",
    },
    &ItemMetadata {
        id: 2166,
        name: "TM106",
    },
    &ItemMetadata {
        id: 2167,
        name: "TM107",
    },
    &ItemMetadata {
        id: 2168,
        name: "TM108",
    },
    &ItemMetadata {
        id: 2169,
        name: "TM109",
    },
    &ItemMetadata {
        id: 2170,
        name: "TM110",
    },
    &ItemMetadata {
        id: 2171,
        name: "TM111",
    },
    &ItemMetadata {
        id: 2172,
        name: "TM112",
    },
    &ItemMetadata {
        id: 2173,
        name: "TM113",
    },
    &ItemMetadata {
        id: 2174,
        name: "TM114",
    },
    &ItemMetadata {
        id: 2175,
        name: "TM115",
    },
    &ItemMetadata {
        id: 2176,
        name: "TM116",
    },
    &ItemMetadata {
        id: 2177,
        name: "TM117",
    },
    &ItemMetadata {
        id: 2178,
        name: "TM118",
    },
    &ItemMetadata {
        id: 2179,
        name: "TM119",
    },
    &ItemMetadata {
        id: 2180,
        name: "TM120",
    },
    &ItemMetadata {
        id: 2181,
        name: "TM121",
    },
    &ItemMetadata {
        id: 2182,
        name: "TM122",
    },
    &ItemMetadata {
        id: 2183,
        name: "TM123",
    },
    &ItemMetadata {
        id: 2184,
        name: "TM124",
    },
    &ItemMetadata {
        id: 2185,
        name: "TM125",
    },
    &ItemMetadata {
        id: 2186,
        name: "TM126",
    },
    &ItemMetadata {
        id: 2187,
        name: "TM127",
    },
    &ItemMetadata {
        id: 2188,
        name: "TM128",
    },
    &ItemMetadata {
        id: 2189,
        name: "TM129",
    },
    &ItemMetadata {
        id: 2190,
        name: "TM130",
    },
    &ItemMetadata {
        id: 2191,
        name: "TM131",
    },
    &ItemMetadata {
        id: 2192,
        name: "TM132",
    },
    &ItemMetadata {
        id: 2193,
        name: "TM133",
    },
    &ItemMetadata {
        id: 2194,
        name: "TM134",
    },
    &ItemMetadata {
        id: 2195,
        name: "TM135",
    },
    &ItemMetadata {
        id: 2196,
        name: "TM136",
    },
    &ItemMetadata {
        id: 2197,
        name: "TM137",
    },
    &ItemMetadata {
        id: 2198,
        name: "TM138",
    },
    &ItemMetadata {
        id: 2199,
        name: "TM139",
    },
    &ItemMetadata {
        id: 2200,
        name: "TM140",
    },
    &ItemMetadata {
        id: 2201,
        name: "TM141",
    },
    &ItemMetadata {
        id: 2202,
        name: "TM142",
    },
    &ItemMetadata {
        id: 2203,
        name: "TM143",
    },
    &ItemMetadata {
        id: 2204,
        name: "TM144",
    },
    &ItemMetadata {
        id: 2205,
        name: "TM145",
    },
    &ItemMetadata {
        id: 2206,
        name: "TM146",
    },
    &ItemMetadata {
        id: 2207,
        name: "TM147",
    },
    &ItemMetadata {
        id: 2208,
        name: "TM148",
    },
    &ItemMetadata {
        id: 2209,
        name: "TM149",
    },
    &ItemMetadata {
        id: 2210,
        name: "TM150",
    },
    &ItemMetadata {
        id: 2211,
        name: "TM151",
    },
    &ItemMetadata {
        id: 2212,
        name: "TM152",
    },
    &ItemMetadata {
        id: 2213,
        name: "TM153",
    },
    &ItemMetadata {
        id: 2214,
        name: "TM154",
    },
    &ItemMetadata {
        id: 2215,
        name: "TM155",
    },
    &ItemMetadata {
        id: 2216,
        name: "TM156",
    },
    &ItemMetadata {
        id: 2217,
        name: "TM157",
    },
    &ItemMetadata {
        id: 2218,
        name: "TM158",
    },
    &ItemMetadata {
        id: 2219,
        name: "TM159",
    },
    &ItemMetadata {
        id: 2220,
        name: "TM160",
    },
    &ItemMetadata {
        id: 2221,
        name: "TM161",
    },
    &ItemMetadata {
        id: 2222,
        name: "TM162",
    },
    &ItemMetadata {
        id: 2223,
        name: "TM163",
    },
    &ItemMetadata {
        id: 2224,
        name: "TM164",
    },
    &ItemMetadata {
        id: 2225,
        name: "TM165",
    },
    &ItemMetadata {
        id: 2226,
        name: "TM166",
    },
    &ItemMetadata {
        id: 2227,
        name: "TM167",
    },
    &ItemMetadata {
        id: 2228,
        name: "TM168",
    },
    &ItemMetadata {
        id: 2229,
        name: "TM169",
    },
    &ItemMetadata {
        id: 2230,
        name: "TM170",
    },
    &ItemMetadata {
        id: 2231,
        name: "TM171",
    },
    &ItemMetadata {
        id: 2232,
        name: "TM172",
    },
    &ItemMetadata {
        id: 2233,
        name: "TM173",
    },
    &ItemMetadata {
        id: 2234,
        name: "TM174",
    },
    &ItemMetadata {
        id: 2235,
        name: "TM175",
    },
    &ItemMetadata {
        id: 2236,
        name: "TM176",
    },
    &ItemMetadata {
        id: 2237,
        name: "TM177",
    },
    &ItemMetadata {
        id: 2238,
        name: "TM178",
    },
    &ItemMetadata {
        id: 2239,
        name: "TM179",
    },
    &ItemMetadata {
        id: 2240,
        name: "TM180",
    },
    &ItemMetadata {
        id: 2241,
        name: "TM181",
    },
    &ItemMetadata {
        id: 2242,
        name: "TM182",
    },
    &ItemMetadata {
        id: 2243,
        name: "TM183",
    },
    &ItemMetadata {
        id: 2244,
        name: "TM184",
    },
    &ItemMetadata {
        id: 2245,
        name: "TM185",
    },
    &ItemMetadata {
        id: 2246,
        name: "TM186",
    },
    &ItemMetadata {
        id: 2247,
        name: "TM187",
    },
    &ItemMetadata {
        id: 2248,
        name: "TM188",
    },
    &ItemMetadata {
        id: 2249,
        name: "TM189",
    },
    &ItemMetadata {
        id: 2250,
        name: "TM190",
    },
    &ItemMetadata {
        id: 2251,
        name: "TM191",
    },
    &ItemMetadata {
        id: 2252,
        name: "TM192",
    },
    &ItemMetadata {
        id: 2253,
        name: "TM193",
    },
    &ItemMetadata {
        id: 2254,
        name: "TM194",
    },
    &ItemMetadata {
        id: 2255,
        name: "TM195",
    },
    &ItemMetadata {
        id: 2256,
        name: "TM196",
    },
    &ItemMetadata {
        id: 2257,
        name: "TM197",
    },
    &ItemMetadata {
        id: 2258,
        name: "TM198",
    },
    &ItemMetadata {
        id: 2259,
        name: "TM199",
    },
    &ItemMetadata {
        id: 2260,
        name: "TM200",
    },
    &ItemMetadata {
        id: 2261,
        name: "TM201",
    },
    &ItemMetadata {
        id: 2262,
        name: "TM202",
    },
    &ItemMetadata {
        id: 2263,
        name: "TM203",
    },
    &ItemMetadata {
        id: 2264,
        name: "TM204",
    },
    &ItemMetadata {
        id: 2265,
        name: "TM205",
    },
    &ItemMetadata {
        id: 2266,
        name: "TM206",
    },
    &ItemMetadata {
        id: 2267,
        name: "TM207",
    },
    &ItemMetadata {
        id: 2268,
        name: "TM208",
    },
    &ItemMetadata {
        id: 2269,
        name: "TM209",
    },
    &ItemMetadata {
        id: 2270,
        name: "TM210",
    },
    &ItemMetadata {
        id: 2271,
        name: "TM211",
    },
    &ItemMetadata {
        id: 2272,
        name: "TM212",
    },
    &ItemMetadata {
        id: 2273,
        name: "TM213",
    },
    &ItemMetadata {
        id: 2274,
        name: "TM214",
    },
    &ItemMetadata {
        id: 2275,
        name: "TM215",
    },
    &ItemMetadata {
        id: 2276,
        name: "TM216",
    },
    &ItemMetadata {
        id: 2277,
        name: "TM217",
    },
    &ItemMetadata {
        id: 2278,
        name: "TM218",
    },
    &ItemMetadata {
        id: 2279,
        name: "TM219",
    },
    &ItemMetadata {
        id: 2280,
        name: "TM220",
    },
    &ItemMetadata {
        id: 2281,
        name: "TM221",
    },
    &ItemMetadata {
        id: 2282,
        name: "TM222",
    },
    &ItemMetadata {
        id: 2283,
        name: "TM223",
    },
    &ItemMetadata {
        id: 2284,
        name: "TM224",
    },
    &ItemMetadata {
        id: 2285,
        name: "TM225",
    },
    &ItemMetadata {
        id: 2286,
        name: "TM226",
    },
    &ItemMetadata {
        id: 2287,
        name: "TM227",
    },
    &ItemMetadata {
        id: 2288,
        name: "TM228",
    },
    &ItemMetadata {
        id: 2289,
        name: "TM229",
    },
    &ItemMetadata { id: 2290, name: "" },
    &ItemMetadata { id: 2291, name: "" },
    &ItemMetadata { id: 2292, name: "" },
    &ItemMetadata { id: 2293, name: "" },
    &ItemMetadata { id: 2294, name: "" },
    &ItemMetadata { id: 2295, name: "" },
    &ItemMetadata { id: 2296, name: "" },
    &ItemMetadata { id: 2297, name: "" },
    &ItemMetadata { id: 2298, name: "" },
    &ItemMetadata { id: 2299, name: "" },
    &ItemMetadata { id: 2300, name: "" },
    &ItemMetadata { id: 2301, name: "" },
    &ItemMetadata { id: 2302, name: "" },
    &ItemMetadata { id: 2303, name: "" },
    &ItemMetadata { id: 2304, name: "" },
    &ItemMetadata { id: 2305, name: "" },
    &ItemMetadata { id: 2306, name: "" },
    &ItemMetadata { id: 2307, name: "" },
    &ItemMetadata { id: 2308, name: "" },
    &ItemMetadata { id: 2309, name: "" },
    &ItemMetadata { id: 2310, name: "" },
    &ItemMetadata {
        id: 2311,
        name: "Picnic Set",
    },
    &ItemMetadata { id: 2312, name: "" },
    &ItemMetadata {
        id: 2313,
        name: "Academy Bottle",
    },
    &ItemMetadata {
        id: 2314,
        name: "Academy Bottle",
    },
    &ItemMetadata {
        id: 2315,
        name: "Polka-Dot Bottle",
    },
    &ItemMetadata {
        id: 2316,
        name: "Striped Bottle",
    },
    &ItemMetadata {
        id: 2317,
        name: "Diamond Bottle",
    },
    &ItemMetadata {
        id: 2318,
        name: "Academy Cup",
    },
    &ItemMetadata {
        id: 2319,
        name: "Academy Cup",
    },
    &ItemMetadata {
        id: 2320,
        name: "Striped Cup",
    },
    &ItemMetadata {
        id: 2321,
        name: "Polka-Dot Cup",
    },
    &ItemMetadata {
        id: 2322,
        name: "Flower Pattern Cup",
    },
    &ItemMetadata {
        id: 2323,
        name: "Academy Tablecloth",
    },
    &ItemMetadata {
        id: 2324,
        name: "Academy Tablecloth",
    },
    &ItemMetadata {
        id: 2325,
        name: "Whimsical Tablecloth",
    },
    &ItemMetadata {
        id: 2326,
        name: "Leafy Tablecloth",
    },
    &ItemMetadata {
        id: 2327,
        name: "Spooky Tablecloth",
    },
    &ItemMetadata { id: 2328, name: "" },
    &ItemMetadata {
        id: 2329,
        name: "Academy Ball",
    },
    &ItemMetadata {
        id: 2330,
        name: "Academy Ball",
    },
    &ItemMetadata {
        id: 2331,
        name: "Marill Ball",
    },
    &ItemMetadata {
        id: 2332,
        name: "Yarn Ball",
    },
    &ItemMetadata {
        id: 2333,
        name: "Cyber Ball",
    },
    &ItemMetadata {
        id: 2334,
        name: "Gold Pick",
    },
    &ItemMetadata {
        id: 2335,
        name: "Silver Pick",
    },
    &ItemMetadata {
        id: 2336,
        name: "Red-Flag Pick",
    },
    &ItemMetadata {
        id: 2337,
        name: "Blue-Flag Pick",
    },
    &ItemMetadata {
        id: 2338,
        name: "Pika-Pika Pick",
    },
    &ItemMetadata {
        id: 2339,
        name: "Winking Pika Pick",
    },
    &ItemMetadata {
        id: 2340,
        name: "Vee-Vee Pick",
    },
    &ItemMetadata {
        id: 2341,
        name: "Smiling Vee Pick",
    },
    &ItemMetadata {
        id: 2342,
        name: "Blue Poké Ball Pick",
    },
    &ItemMetadata { id: 2343, name: "" },
    &ItemMetadata {
        id: 2344,
        name: "Auspicious Armor",
    },
    &ItemMetadata {
        id: 2345,
        name: "Leader’s Crest",
    },
    &ItemMetadata { id: 2346, name: "" },
    &ItemMetadata { id: 2347, name: "" },
    &ItemMetadata {
        id: 2348,
        name: "Pink Bottle",
    },
    &ItemMetadata {
        id: 2349,
        name: "Blue Bottle",
    },
    &ItemMetadata {
        id: 2350,
        name: "Yellow Bottle",
    },
    &ItemMetadata {
        id: 2351,
        name: "Steel Bottle (R)",
    },
    &ItemMetadata {
        id: 2352,
        name: "Steel Bottle (Y)",
    },
    &ItemMetadata {
        id: 2353,
        name: "Steel Bottle (B)",
    },
    &ItemMetadata {
        id: 2354,
        name: "Silver Bottle",
    },
    &ItemMetadata {
        id: 2355,
        name: "Barred Cup",
    },
    &ItemMetadata {
        id: 2356,
        name: "Diamond Pattern Cup",
    },
    &ItemMetadata {
        id: 2357,
        name: "Fire Pattern Cup",
    },
    &ItemMetadata {
        id: 2358,
        name: "Pink Cup",
    },
    &ItemMetadata {
        id: 2359,
        name: "Blue Cup",
    },
    &ItemMetadata {
        id: 2360,
        name: "Yellow Cup",
    },
    &ItemMetadata {
        id: 2361,
        name: "Pikachu Cup",
    },
    &ItemMetadata {
        id: 2362,
        name: "Eevee Cup",
    },
    &ItemMetadata {
        id: 2363,
        name: "Slowpoke Cup",
    },
    &ItemMetadata {
        id: 2364,
        name: "Silver Cup",
    },
    &ItemMetadata {
        id: 2365,
        name: "Exercise Ball",
    },
    &ItemMetadata {
        id: 2366,
        name: "Plaid Tablecloth (Y)",
    },
    &ItemMetadata {
        id: 2367,
        name: "Plaid Tablecloth (B)",
    },
    &ItemMetadata {
        id: 2368,
        name: "Plaid Tablecloth (R)",
    },
    &ItemMetadata {
        id: 2369,
        name: "B&W Grass Tablecloth",
    },
    &ItemMetadata {
        id: 2370,
        name: "Battle Tablecloth",
    },
    &ItemMetadata {
        id: 2371,
        name: "Monstrous Tablecloth",
    },
    &ItemMetadata {
        id: 2372,
        name: "Striped Tablecloth",
    },
    &ItemMetadata {
        id: 2373,
        name: "Diamond Tablecloth",
    },
    &ItemMetadata {
        id: 2374,
        name: "Polka-Dot Tablecloth",
    },
    &ItemMetadata {
        id: 2375,
        name: "Lilac Tablecloth",
    },
    &ItemMetadata {
        id: 2376,
        name: "Mint Tablecloth",
    },
    &ItemMetadata {
        id: 2377,
        name: "Peach Tablecloth",
    },
    &ItemMetadata {
        id: 2378,
        name: "Yellow Tablecloth",
    },
    &ItemMetadata {
        id: 2379,
        name: "Blue Tablecloth",
    },
    &ItemMetadata {
        id: 2380,
        name: "Pink Tablecloth",
    },
    &ItemMetadata {
        id: 2381,
        name: "Gold Bottle",
    },
    &ItemMetadata {
        id: 2382,
        name: "Bronze Bottle",
    },
    &ItemMetadata {
        id: 2383,
        name: "Gold Cup",
    },
    &ItemMetadata {
        id: 2384,
        name: "Bronze Cup",
    },
    &ItemMetadata {
        id: 2385,
        name: "Green Poké Ball Pick",
    },
    &ItemMetadata {
        id: 2386,
        name: "Red Poké Ball Pick",
    },
    &ItemMetadata {
        id: 2387,
        name: "Party Sparkler Pick",
    },
    &ItemMetadata {
        id: 2388,
        name: "Heroic Sword Pick",
    },
    &ItemMetadata {
        id: 2389,
        name: "Magical Star Pick",
    },
    &ItemMetadata {
        id: 2390,
        name: "Magical Heart Pick",
    },
    &ItemMetadata {
        id: 2391,
        name: "Parasol Pick",
    },
    &ItemMetadata {
        id: 2392,
        name: "Blue-Sky Flower Pick",
    },
    &ItemMetadata {
        id: 2393,
        name: "Sunset Flower Pick",
    },
    &ItemMetadata {
        id: 2394,
        name: "Sunrise Flower Pick",
    },
    &ItemMetadata {
        id: 2395,
        name: "Blue Dish",
    },
    &ItemMetadata {
        id: 2396,
        name: "Green Dish",
    },
    &ItemMetadata {
        id: 2397,
        name: "Orange Dish",
    },
    &ItemMetadata {
        id: 2398,
        name: "Red Dish",
    },
    &ItemMetadata {
        id: 2399,
        name: "White Dish",
    },
    &ItemMetadata {
        id: 2400,
        name: "Yellow Dish",
    },
    &ItemMetadata {
        id: 2401,
        name: "Fairy Feather",
    },
    &ItemMetadata {
        id: 2402,
        name: "Syrupy Apple",
    },
    &ItemMetadata {
        id: 2403,
        name: "Unremarkable Teacup",
    },
    &ItemMetadata {
        id: 2404,
        name: "Masterpiece Teacup",
    },
    &ItemMetadata {
        id: 2405,
        name: "Teal Mask",
    },
    &ItemMetadata {
        id: 2406,
        name: "Cornerstone Mask",
    },
    &ItemMetadata {
        id: 2407,
        name: "Wellspring Mask",
    },
    &ItemMetadata {
        id: 2408,
        name: "Hearthflame Mask",
    },
    &ItemMetadata {
        id: 2409,
        name: "Teal Style Card",
    },
    &ItemMetadata {
        id: 2410,
        name: "Crystal Cluster",
    },
    &ItemMetadata {
        id: 2411,
        name: "Health Mochi",
    },
    &ItemMetadata {
        id: 2412,
        name: "Muscle Mochi",
    },
    &ItemMetadata {
        id: 2413,
        name: "Resist Mochi",
    },
    &ItemMetadata {
        id: 2414,
        name: "Genius Mochi",
    },
    &ItemMetadata {
        id: 2415,
        name: "Clever Mochi",
    },
    &ItemMetadata {
        id: 2416,
        name: "Swift Mochi",
    },
    &ItemMetadata {
        id: 2417,
        name: "Simple Chairs",
    },
    &ItemMetadata {
        id: 2418,
        name: "Academy Chairs",
    },
    &ItemMetadata {
        id: 2419,
        name: "Academy Chairs",
    },
    &ItemMetadata {
        id: 2420,
        name: "Whimsical Chairs",
    },
    &ItemMetadata {
        id: 2421,
        name: "Leafy Chairs",
    },
    &ItemMetadata {
        id: 2422,
        name: "Spooky Chairs",
    },
    &ItemMetadata {
        id: 2423,
        name: "Plaid Chairs (Y)",
    },
    &ItemMetadata {
        id: 2424,
        name: "Plaid Chairs (B)",
    },
    &ItemMetadata {
        id: 2425,
        name: "Plaid Chairs (R)",
    },
    &ItemMetadata {
        id: 2426,
        name: "B&W Grass Chairs",
    },
    &ItemMetadata {
        id: 2427,
        name: "Battle Chairs",
    },
    &ItemMetadata {
        id: 2428,
        name: "Monstrous Chairs",
    },
    &ItemMetadata {
        id: 2429,
        name: "Striped Chairs",
    },
    &ItemMetadata {
        id: 2430,
        name: "Diamond Chairs",
    },
    &ItemMetadata {
        id: 2431,
        name: "Polka-Dot Chairs",
    },
    &ItemMetadata {
        id: 2432,
        name: "Lilac Chairs",
    },
    &ItemMetadata {
        id: 2433,
        name: "Mint Chairs",
    },
    &ItemMetadata {
        id: 2434,
        name: "Peach Chairs",
    },
    &ItemMetadata {
        id: 2435,
        name: "Yellow Chairs",
    },
    &ItemMetadata {
        id: 2436,
        name: "Blue Chairs",
    },
    &ItemMetadata {
        id: 2437,
        name: "Pink Chairs",
    },
    &ItemMetadata {
        id: 2438,
        name: "Ekans Fang",
    },
    &ItemMetadata {
        id: 2439,
        name: "Sandshrew Claw",
    },
    &ItemMetadata {
        id: 2440,
        name: "Cleffa Fur",
    },
    &ItemMetadata {
        id: 2441,
        name: "Vulpix Fur",
    },
    &ItemMetadata {
        id: 2442,
        name: "Poliwag Slime",
    },
    &ItemMetadata {
        id: 2443,
        name: "Bellsprout Vine",
    },
    &ItemMetadata {
        id: 2444,
        name: "Geodude Fragment",
    },
    &ItemMetadata {
        id: 2445,
        name: "Koffing Gas",
    },
    &ItemMetadata {
        id: 2446,
        name: "Munchlax Fang",
    },
    &ItemMetadata {
        id: 2447,
        name: "Sentret Fur",
    },
    &ItemMetadata {
        id: 2448,
        name: "Hoothoot Feather",
    },
    &ItemMetadata {
        id: 2449,
        name: "Spinarak Thread",
    },
    &ItemMetadata {
        id: 2450,
        name: "Aipom Hair",
    },
    &ItemMetadata {
        id: 2451,
        name: "Yanma Spike",
    },
    &ItemMetadata {
        id: 2452,
        name: "Gligar Fang",
    },
    &ItemMetadata {
        id: 2453,
        name: "Slugma Lava",
    },
    &ItemMetadata {
        id: 2454,
        name: "Swinub Hair",
    },
    &ItemMetadata {
        id: 2455,
        name: "Poochyena Fang",
    },
    &ItemMetadata {
        id: 2456,
        name: "Lotad Leaf",
    },
    &ItemMetadata {
        id: 2457,
        name: "Seedot Stem",
    },
    &ItemMetadata {
        id: 2458,
        name: "Nosepass Fragment",
    },
    &ItemMetadata {
        id: 2459,
        name: "Volbeat Fluid",
    },
    &ItemMetadata {
        id: 2460,
        name: "Illumise Fluid",
    },
    &ItemMetadata {
        id: 2461,
        name: "Corphish Shell",
    },
    &ItemMetadata {
        id: 2462,
        name: "Feebas Scales",
    },
    &ItemMetadata {
        id: 2463,
        name: "Duskull Fragment",
    },
    &ItemMetadata {
        id: 2464,
        name: "Chingling Fragment",
    },
    &ItemMetadata {
        id: 2465,
        name: "Timburr Sweat",
    },
    &ItemMetadata {
        id: 2466,
        name: "Sewaddle Leaf",
    },
    &ItemMetadata {
        id: 2467,
        name: "Ducklett Feather",
    },
    &ItemMetadata {
        id: 2468,
        name: "Litwick Soot",
    },
    &ItemMetadata {
        id: 2469,
        name: "Mienfoo Claw",
    },
    &ItemMetadata {
        id: 2470,
        name: "Vullaby Feather",
    },
    &ItemMetadata {
        id: 2471,
        name: "Carbink Jewel",
    },
    &ItemMetadata {
        id: 2472,
        name: "Phantump Twig",
    },
    &ItemMetadata {
        id: 2473,
        name: "Grubbin Thread",
    },
    &ItemMetadata {
        id: 2474,
        name: "Cutiefly Powder",
    },
    &ItemMetadata {
        id: 2475,
        name: "Jangmo-o Scales",
    },
    &ItemMetadata {
        id: 2476,
        name: "Cramorant Down",
    },
    &ItemMetadata {
        id: 2477,
        name: "Morpeko Snack",
    },
    &ItemMetadata {
        id: 2478,
        name: "Poltchageist Powder",
    },
    &ItemMetadata {
        id: 2479,
        name: "Fresh-Start Mochi",
    },
    &ItemMetadata {
        id: 2480,
        name: "Roto-Stick",
    },
    &ItemMetadata {
        id: 2481,
        name: "Glimmering Charm",
    },
    &ItemMetadata {
        id: 2482,
        name: "Metal Alloy",
    },
    &ItemMetadata {
        id: 2483,
        name: "Indigo Style Card",
    },
    &ItemMetadata {
        id: 2484,
        name: "Oddish Leaf",
    },
    &ItemMetadata {
        id: 2485,
        name: "Tentacool Stinger",
    },
    &ItemMetadata {
        id: 2486,
        name: "Doduo Down",
    },
    &ItemMetadata {
        id: 2487,
        name: "Seel Fur",
    },
    &ItemMetadata {
        id: 2488,
        name: "Exeggcute Shell",
    },
    &ItemMetadata {
        id: 2489,
        name: "Tyrogue Sweat",
    },
    &ItemMetadata {
        id: 2490,
        name: "Rhyhorn Fang",
    },
    &ItemMetadata {
        id: 2491,
        name: "Horsea Ink",
    },
    &ItemMetadata {
        id: 2492,
        name: "Elekid Fur",
    },
    &ItemMetadata {
        id: 2493,
        name: "Magby Hair",
    },
    &ItemMetadata {
        id: 2494,
        name: "Lapras Teardrop",
    },
    &ItemMetadata {
        id: 2495,
        name: "Porygon Fragment",
    },
    &ItemMetadata {
        id: 2496,
        name: "Chinchou Sparks",
    },
    &ItemMetadata {
        id: 2497,
        name: "Snubbull Hair",
    },
    &ItemMetadata {
        id: 2498,
        name: "Skarmory Feather",
    },
    &ItemMetadata {
        id: 2499,
        name: "Smeargle Paint",
    },
    &ItemMetadata {
        id: 2500,
        name: "Plusle Fur",
    },
    &ItemMetadata {
        id: 2501,
        name: "Minun Fur",
    },
    &ItemMetadata {
        id: 2502,
        name: "Trapinch Shell",
    },
    &ItemMetadata {
        id: 2503,
        name: "Beldum Claw",
    },
    &ItemMetadata {
        id: 2504,
        name: "Cranidos Spike",
    },
    &ItemMetadata {
        id: 2505,
        name: "Shieldon Claw",
    },
    &ItemMetadata {
        id: 2506,
        name: "Blitzle Mane Hair",
    },
    &ItemMetadata {
        id: 2507,
        name: "Drilbur Claw",
    },
    &ItemMetadata {
        id: 2508,
        name: "Cottonee Fluff",
    },
    &ItemMetadata {
        id: 2509,
        name: "Scraggy Sweat",
    },
    &ItemMetadata {
        id: 2510,
        name: "Minccino Fur",
    },
    &ItemMetadata {
        id: 2511,
        name: "Solosis Gel",
    },
    &ItemMetadata {
        id: 2512,
        name: "Joltik Thread",
    },
    &ItemMetadata {
        id: 2513,
        name: "Golett Shard",
    },
    &ItemMetadata {
        id: 2514,
        name: "Espurr Fur",
    },
    &ItemMetadata {
        id: 2515,
        name: "Inkay Ink",
    },
    &ItemMetadata {
        id: 2516,
        name: "Pikipek Feather",
    },
    &ItemMetadata {
        id: 2517,
        name: "Dewpider Thread",
    },
    &ItemMetadata {
        id: 2518,
        name: "Comfey Flower",
    },
    &ItemMetadata {
        id: 2519,
        name: "Minior Shell",
    },
    &ItemMetadata {
        id: 2520,
        name: "Milcery Cream",
    },
    &ItemMetadata {
        id: 2521,
        name: "Duraludon Tarnish",
    },
    &ItemMetadata {
        id: 2522,
        name: "Articuno Treat",
    },
    &ItemMetadata {
        id: 2523,
        name: "Zapdos Treat",
    },
    &ItemMetadata {
        id: 2524,
        name: "Moltres Treat",
    },
    &ItemMetadata {
        id: 2525,
        name: "Raikou Treat",
    },
    &ItemMetadata {
        id: 2526,
        name: "Entei Treat",
    },
    &ItemMetadata {
        id: 2527,
        name: "Suicune Treat",
    },
    &ItemMetadata {
        id: 2528,
        name: "Lugia Treat",
    },
    &ItemMetadata {
        id: 2529,
        name: "Ho-Oh Treat",
    },
    &ItemMetadata {
        id: 2530,
        name: "Latias Treat",
    },
    &ItemMetadata {
        id: 2531,
        name: "Latios Treat",
    },
    &ItemMetadata {
        id: 2532,
        name: "Kyogre Treat",
    },
    &ItemMetadata {
        id: 2533,
        name: "Groudon Treat",
    },
    &ItemMetadata {
        id: 2534,
        name: "Rayquaza Treat",
    },
    &ItemMetadata {
        id: 2535,
        name: "Cobalion Treat",
    },
    &ItemMetadata {
        id: 2536,
        name: "Terrakion Treat",
    },
    &ItemMetadata {
        id: 2537,
        name: "Virizion Treat",
    },
    &ItemMetadata {
        id: 2538,
        name: "Reshiram Treat",
    },
    &ItemMetadata {
        id: 2539,
        name: "Zekrom Treat",
    },
    &ItemMetadata {
        id: 2540,
        name: "Kyurem Treat",
    },
    &ItemMetadata {
        id: 2541,
        name: "Solgaleo Treat",
    },
    &ItemMetadata {
        id: 2542,
        name: "Lunala Treat",
    },
    &ItemMetadata {
        id: 2543,
        name: "Necrozma Treat",
    },
    &ItemMetadata {
        id: 2544,
        name: "Kubfu Treat",
    },
    &ItemMetadata {
        id: 2545,
        name: "Glastrier Treat",
    },
    &ItemMetadata {
        id: 2546,
        name: "Spectrier Treat",
    },
    &ItemMetadata {
        id: 2547,
        name: "Indigo Disk",
    },
    &ItemMetadata {
        id: 2548,
        name: "Fiery Pick",
    },
    &ItemMetadata {
        id: 2549,
        name: "Stellar Tera Shard",
    },
    &ItemMetadata {
        id: 2550,
        name: "Mythical Pecha Berry",
    },
    &ItemMetadata {
        id: 2551,
        name: "Blueberry Tablecloth",
    },
    &ItemMetadata {
        id: 2552,
        name: "Blueberry Chairs",
    },
    &ItemMetadata {
        id: 2553,
        name: "Synchro Machine",
    },
    &ItemMetadata {
        id: 2554,
        name: "Meteorite",
    },
    &ItemMetadata {
        id: 2555,
        name: "Scarlet Book",
    },
    &ItemMetadata {
        id: 2556,
        name: "Violet Book",
    },
    &ItemMetadata {
        id: 2557,
        name: "Briar’s Book",
    },
    &ItemMetadata {
        id: 2558,
        name: "Seed of Mastery",
    },
    &ItemMetadata {
        id: 2559,
        name: "Clefablite",
    },
    &ItemMetadata {
        id: 2560,
        name: "Victreebelite",
    },
    &ItemMetadata {
        id: 2561,
        name: "Starminite",
    },
    &ItemMetadata {
        id: 2562,
        name: "Dragoninite",
    },
    &ItemMetadata {
        id: 2563,
        name: "Meganiumite",
    },
    &ItemMetadata {
        id: 2564,
        name: "Feraligite",
    },
    &ItemMetadata {
        id: 2565,
        name: "Skarmorite",
    },
    &ItemMetadata {
        id: 2566,
        name: "Froslassite",
    },
    &ItemMetadata { id: 2567, name: "" },
    &ItemMetadata { id: 2568, name: "" },
    &ItemMetadata {
        id: 2569,
        name: "Emboarite",
    },
    &ItemMetadata {
        id: 2570,
        name: "Excadrite",
    },
    &ItemMetadata {
        id: 2571,
        name: "Scolipite",
    },
    &ItemMetadata {
        id: 2572,
        name: "Scraftinite",
    },
    &ItemMetadata {
        id: 2573,
        name: "Eelektrossite",
    },
    &ItemMetadata {
        id: 2574,
        name: "Chandelurite",
    },
    &ItemMetadata {
        id: 2575,
        name: "Chesnaughtite",
    },
    &ItemMetadata {
        id: 2576,
        name: "Delphoxite",
    },
    &ItemMetadata {
        id: 2577,
        name: "Greninjite",
    },
    &ItemMetadata {
        id: 2578,
        name: "Pyroarite",
    },
    &ItemMetadata {
        id: 2579,
        name: "Floettite",
    },
    &ItemMetadata {
        id: 2580,
        name: "Malamarite",
    },
    &ItemMetadata {
        id: 2581,
        name: "Barbaracite",
    },
    &ItemMetadata {
        id: 2582,
        name: "Dragalgite",
    },
    &ItemMetadata {
        id: 2583,
        name: "Hawluchanite",
    },
    &ItemMetadata {
        id: 2584,
        name: "Zygardite",
    },
    &ItemMetadata {
        id: 2585,
        name: "Drampanite",
    },
    &ItemMetadata { id: 2586, name: "" },
    &ItemMetadata {
        id: 2587,
        name: "Falinksite",
    },
    &ItemMetadata {
        id: 2588,
        name: "Key to Room 202",
    },
    &ItemMetadata {
        id: 2589,
        name: "Super Lumiose Galette",
    },
    &ItemMetadata {
        id: 2590,
        name: "Lab Key Card A",
    },
    &ItemMetadata {
        id: 2591,
        name: "Lab Key Card B",
    },
    &ItemMetadata {
        id: 2592,
        name: "Lab Key Card C",
    },
    &ItemMetadata { id: 2593, name: "" },
    &ItemMetadata { id: 2594, name: "" },
    &ItemMetadata {
        id: 2595,
        name: "Pebble",
    },
    &ItemMetadata {
        id: 2596,
        name: "Cherished Ring",
    },
    &ItemMetadata {
        id: 2597,
        name: "Autographed Plush",
    },
    &ItemMetadata {
        id: 2598,
        name: "Tasty Trash",
    },
    &ItemMetadata {
        id: 2599,
        name: "Revitalizing Twig",
    },
    &ItemMetadata {
        id: 2600,
        name: "Lida’s Things",
    },
    &ItemMetadata { id: 2601, name: "" },
    &ItemMetadata { id: 2603, name: "" },
    &ItemMetadata { id: 2605, name: "" },
    &ItemMetadata { id: 2606, name: "" },
    &ItemMetadata { id: 2607, name: "" },
    &ItemMetadata { id: 2608, name: "" },
    &ItemMetadata { id: 2609, name: "" },
    &ItemMetadata { id: 2610, name: "" },
    &ItemMetadata { id: 2611, name: "" },
    &ItemMetadata { id: 2612, name: "" },
    &ItemMetadata { id: 2613, name: "" },
    &ItemMetadata { id: 2614, name: "" },
    &ItemMetadata { id: 2615, name: "" },
    &ItemMetadata { id: 2616, name: "" },
    &ItemMetadata { id: 2617, name: "" },
    &ItemMetadata {
        id: 2618,
        name: "Mega Shard",
    },
    &ItemMetadata {
        id: 2619,
        name: "Colorful Screw",
    },
    &ItemMetadata {
        id: 2620,
        name: "Red Canari Plush",
    },
    &ItemMetadata {
        id: 2621,
        name: "Red Canari Plush",
    },
    &ItemMetadata {
        id: 2622,
        name: "Red Canari Plush",
    },
    &ItemMetadata {
        id: 2623,
        name: "Gold Canari Plush",
    },
    &ItemMetadata {
        id: 2624,
        name: "Gold Canari Plush",
    },
    &ItemMetadata {
        id: 2625,
        name: "Gold Canari Plush",
    },
    &ItemMetadata {
        id: 2626,
        name: "Pink Canari Plush",
    },
    &ItemMetadata {
        id: 2627,
        name: "Pink Canari Plush",
    },
    &ItemMetadata {
        id: 2628,
        name: "Pink Canari Plush",
    },
    &ItemMetadata {
        id: 2629,
        name: "Green Canari Plush",
    },
    &ItemMetadata {
        id: 2630,
        name: "Green Canari Plush",
    },
    &ItemMetadata {
        id: 2631,
        name: "Green Canari Plush",
    },
    &ItemMetadata {
        id: 2632,
        name: "Blue Canari Plush",
    },
    &ItemMetadata {
        id: 2633,
        name: "Blue Canari Plush",
    },
    &ItemMetadata {
        id: 2634,
        name: "Blue Canari Plush",
    },
];
