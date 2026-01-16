const fs = require('fs');
const path = require('path');

// Load data files
const speciesData = JSON.parse(fs.readFileSync('./pkm_rs_resources/text_source/species.json', 'utf8'));
const movesData = JSON.parse(fs.readFileSync('./pkm_rs_resources/text_source/moves.json', 'utf8'));

// Experience curves for level calculation
const EXPERIENCE_CURVES = {
  'Erratic': [
    0, 15, 52, 122, 237, 406, 637, 942, 1326, 1800, 2369, 3041, 3822, 4719, 5737, 6881, 8155,
    9564, 11111, 12800, 14632, 16610, 18737, 21012, 23437, 26012, 28737, 31610, 34632, 37800,
    41111, 44564, 48155, 51881, 55737, 59719, 63822, 68041, 72369, 76800, 81326, 85942, 90637,
    95406, 100237, 105122, 110052, 115015, 120001, 125000, 131324, 137795, 144410, 151165,
    158056, 165079, 172229, 179503, 186894, 194400, 202013, 209728, 217540, 225443, 233431,
    241496, 249633, 257834, 267406, 276458, 286328, 296358, 305767, 316074, 326531, 336255,
    346965, 357812, 367807, 378880, 390077, 400293, 411686, 423190, 433572, 445239, 457001,
    467489, 479378, 491346, 501878, 513934, 526049, 536557, 548720, 560922, 571333, 583539,
    591882, 600000
  ],
  'Fast': [
    0, 6, 21, 51, 100, 172, 274, 409, 583, 800, 1064, 1382, 1757, 2195, 2700, 3276, 3930, 4665,
    5487, 6400, 7408, 8518, 9733, 11059, 12500, 14060, 15746, 17561, 19511, 21600, 23832, 26214,
    28749, 31443, 34300, 37324, 40522, 43897, 47455, 51200, 55136, 59270, 63605, 68147, 72900,
    77868, 83058, 88473, 94119, 100000, 106120, 112486, 119101, 125971, 133100, 140492, 148154,
    156089, 164303, 172800, 181584, 190662, 200037, 209715, 219700, 229996, 240610, 251545,
    262807, 274400, 286328, 298598, 311213, 324179, 337500, 351180, 365226, 379641, 394431,
    409600, 425152, 441094, 457429, 474163, 491300, 508844, 526802, 545177, 563975, 583200,
    602856, 622950, 643485, 664467, 685900, 707788, 730138, 752953, 776239, 800000
  ],
  'Medium Fast': [
    0, 8, 27, 64, 125, 216, 343, 512, 729, 1000, 1331, 1728, 2197, 2744, 3375, 4096, 4913, 5832,
    6859, 8000, 9261, 10648, 12167, 13824, 15625, 17576, 19683, 21952, 24389, 27000, 29791,
    32768, 35937, 39304, 42875, 46656, 50653, 54872, 59319, 64000, 68921, 74088, 79507, 85184,
    91125, 97336, 103823, 110592, 117649, 125000, 132651, 140608, 148877, 157464, 166375,
    175616, 185193, 195112, 205379, 216000, 226981, 238328, 250047, 262144, 274625, 287496,
    300763, 314432, 328509, 343000, 357911, 373248, 389017, 405224, 421875, 438976, 456533,
    474552, 493039, 512000, 531441, 551368, 571787, 592704, 614125, 636056, 658503, 681472,
    704969, 729000, 753571, 778688, 804357, 830584, 857375, 884736, 912673, 941192, 970299,
    1000000
  ],
  'Medium Slow': [
    0, 9, 57, 96, 135, 179, 236, 314, 419, 560, 742, 973, 1261, 1612, 2035, 2535, 3120, 3798,
    4575, 5460, 6458, 7577, 8825, 10208, 11735, 13411, 15244, 17242, 19411, 21760, 24294, 27021,
    29949, 33084, 36435, 40007, 43808, 47846, 52127, 56660, 61450, 66505, 71833, 77440, 83335,
    89523, 96012, 102810, 109923, 117360, 125126, 133229, 141677, 150476, 159635, 169159,
    179056, 189334, 199999, 211060, 222522, 234393, 246681, 259392, 272535, 286115, 300140,
    314618, 329555, 344960, 360838, 377197, 394045, 411388, 429235, 447591, 466464, 485862,
    505791, 526260, 547274, 568841, 590969, 613664, 636935, 660787, 685228, 710266, 735907,
    762160, 789030, 816525, 844653, 873420, 902835, 932903, 963632, 995030, 1027103, 1059860
  ],
  'Slow': [
    0, 10, 33, 80, 156, 270, 428, 640, 911, 1250, 1663, 2160, 2746, 3430, 4218, 5120, 6141, 7290,
    8573, 10000, 11576, 13310, 15208, 17280, 19531, 21970, 24603, 27440, 30486, 33750, 37238,
    40960, 44921, 49130, 53593, 58320, 63316, 68590, 74148, 80000, 86151, 92610, 99383, 106480,
    113906, 121670, 129778, 138240, 147061, 156250, 165813, 175760, 186096, 196830, 207968,
    219520, 231491, 243890, 256723, 270000, 283726, 297910, 312558, 327680, 343281, 359370,
    375953, 393040, 410636, 428750, 447388, 466560, 486271, 506530, 527343, 548720, 570666,
    593190, 616298, 640000, 664301, 689210, 714733, 740880, 767656, 795070, 823128, 851840,
    881211, 911250, 941963, 973360, 1005446, 1038230, 1071718, 1105920, 1140841, 1176490,
    1212873, 1250000
  ],
  'Fluctuating': [
    0, 4, 13, 32, 65, 112, 178, 276, 393, 540, 745, 967, 1230, 1591, 1957, 2457, 3046, 3732,
    4526, 5440, 6482, 7666, 9003, 10506, 12187, 14060, 16140, 18439, 20974, 23760, 26811, 30146,
    33780, 37731, 42017, 46656, 50653, 55969, 60505, 66560, 71677, 78533, 84277, 91998, 98415,
    107069, 114205, 123863, 131766, 142500, 151222, 163105, 172697, 185807, 196322, 210739,
    222231, 238036, 250562, 267840, 281456, 300293, 315059, 335544, 351520, 373744, 390991,
    415050, 433631, 459620, 479600, 507617, 529063, 559209, 582187, 614566, 639146, 673863,
    700115, 737280, 765275, 804997, 834809, 877201, 908905, 954084, 987754, 1035837, 1071552,
    1122660, 1160499, 1214753, 1254796, 1312322, 1354652, 1415577, 1460276, 1524731, 1571884,
    1640000
  ]
};

function calculateLevel(exp, levelUpType) {
  const curve = EXPERIENCE_CURVES[levelUpType];
  if (!curve) {
    console.warn(`Unknown level up type: ${levelUpType}, using Medium Fast`);
    return calculateLevel(exp, 'Medium Fast');
  }

  for (let level = 1; level <= 100; level++) {
    if (exp < curve[level]) {
      return level;
    }
  }
  return 100;
}

function getSpeciesInfo(speciesIndex) {
  const species = speciesData[speciesIndex];
  if (!species) {
    return {
      name: `Unknown (${speciesIndex})`,
      baseStats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
      levelUpType: 'Medium Fast'
    };
  }

  const forme = species.formes && species.formes[0];
  return {
    name: species.name,
    baseStats: forme?.baseStats || { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
    levelUpType: species.levelUpType || 'Medium Fast'
  };
}

function getMoveName(moveId) {
  const move = movesData[moveId];
  return move ? move.name : `Unknown Move (${moveId})`;
}

function calculateStat(base, iv, ev, level, isHP) {
  if (isHP) {
    return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
  }
  return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5;
}

// Read 16-bit little endian
function bytesToUint16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

// Read 32-bit little endian
function bytesToUint32LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

// Get bits from buffer
function getBits(bytes, offset, bitOffset, bitLength) {
  const byte1 = bytes[offset] || 0;
  const byte2 = bytes[offset + 1] || 0;
  const combined = byte1 | (byte2 << 8);
  const mask = (1 << bitLength) - 1;
  return (combined >> bitOffset) & mask;
}

// Gen3 string to UTF8
function gen3StringToUTF(bytes, offset, maxLength) {
  const charMap = [
    ' ', 'À', 'Á', 'Â', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'こ', 'Î', 'Ï', 'Ò', 'Ó', 'Ô',
    'Œ', 'Ù', 'Ú', 'Û', 'Ñ', 'ß', 'à', 'á', 'ね', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'ま',
    'î', 'ï', 'ò', 'ó', 'ô', 'œ', 'ù', 'ú', 'û', 'ñ', 'º', 'ª', '⒅', '&', '+', 'あ',
    'ぃ', 'ぅ', 'ぇ', 'ぉ', 'v', '=', 'ょ', '0', '1', '2', '3', '4', '5', '6', '7',
    '8', '9', '!', '?', '.', '-', '・', '…', '"', '"', '\'', '\'', '♂', '♀', '$', ',', '×', '/',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'ま',
    'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
    'v', 'w', 'x', 'y', 'z', '▶', ':', 'Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü',
  ];

  let result = '';
  for (let i = 0; i < maxLength; i++) {
    const byte = bytes[offset + i];
    if (byte === 0xFF || byte === 0x00) break;

    if (byte >= 0xA1 && byte <= 0xFE) {
      result += charMap[byte - 0xA1] || '?';
    } else {
      result += '?';
    }
  }
  return result;
}

// Parse a single Pokemon
function parsePokemon(bytes) {
  if (bytes.length < 58) return null;

  const speciesIndex = bytesToUint16LE(bytes, 0x1c);
  if (speciesIndex === 0) return null;

  const personalityValue = bytesToUint32LE(bytes, 0x00);
  const trainerID = bytesToUint16LE(bytes, 0x04);
  const secretID = bytesToUint16LE(bytes, 0x06);
  const nickname = gen3StringToUTF(bytes, 0x08, 10);
  const exp = bytesToUint32LE(bytes, 0x20);

  // Moves (10 bits each)
  const moves = [
    getBits(bytes, 0x27, 0, 10),
    getBits(bytes, 0x28, 2, 10),
    getBits(bytes, 0x29, 4, 10),
    getBits(bytes, 0x2a, 6, 10),
  ];

  // EVs
  const hpEV = bytes[0x2c];
  const attackEV = bytes[0x2d];
  const defenseEV = bytes[0x2e];
  const speedEV = bytes[0x2f];
  const spAtkEV = bytes[0x30];
  const spDefEV = bytes[0x31];

  // IVs
  const ivData = bytesToUint32LE(bytes, 0x36);
  const hpIV = ivData & 0x1f;
  const attackIV = (ivData >> 5) & 0x1f;
  const defenseIV = (ivData >> 10) & 0x1f;
  const speedIV = (ivData >> 15) & 0x1f;
  const spAtkIV = (ivData >> 20) & 0x1f;
  const spDefIV = (ivData >> 25) & 0x1f;

  // Get species info
  const speciesInfo = getSpeciesInfo(speciesIndex);
  const level = calculateLevel(exp, speciesInfo.levelUpType);

  // Calculate actual stats
  const hp = calculateStat(speciesInfo.baseStats.hp, hpIV, hpEV, level, true);
  const attack = calculateStat(speciesInfo.baseStats.atk, attackIV, attackEV, level, false);
  const defense = calculateStat(speciesInfo.baseStats.def, defenseIV, defenseEV, level, false);
  const spAtk = calculateStat(speciesInfo.baseStats.spa, spAtkIV, spAtkEV, level, false);
  const spDef = calculateStat(speciesInfo.baseStats.spd, spDefIV, spDefEV, level, false);
  const speed = calculateStat(speciesInfo.baseStats.spe, speedIV, speedEV, level, false);

  return {
    speciesIndex,
    speciesName: speciesInfo.name,
    nickname,
    level,
    exp,
    baseStats: speciesInfo.baseStats,
    stats: { hp, attack, defense, spAtk, spDef, speed },
    ivs: { hp: hpIV, attack: attackIV, defense: defenseIV, spAtk: spAtkIV, spDef: spDefIV, speed: speedIV },
    evs: { hp: hpEV, attack: attackEV, defense: defenseEV, spAtk: spAtkEV, spDef: spDefEV, speed: speedEV },
    moves: moves.filter(m => m > 0).map(m => ({ id: m, name: getMoveName(m) })),
    personalityValue,
    trainerID,
    secretID
  };
}

// Parse save file
function parseSave(saveFilePath) {
  const saveData = fs.readFileSync(saveFilePath);
  console.log('\n=== PARSING SAVE FILE ===');
  console.log('File:', saveFilePath);
  console.log('Size:', saveData.length, 'bytes\n');

  // Parse sectors
  const sectors = [];
  for (let i = 0; i < 14; i++) {
    const sectionID = bytesToUint16LE(saveData, i * 0x1000 + 0xff4);
    const saveIndex = bytesToUint32LE(saveData, i * 0x1000 + 0xffc);
    sectors.push({
      index: i,
      sectionID,
      saveIndex,
      data: saveData.slice(i * 0x1000, i * 0x1000 + 4080)
    });
  }

  sectors.sort((a, b) => a.sectionID - b.sectionID);

  // Reconstruct PC data (boxes are in sectors 5-11)
  const NUM_BOXES = 18;
  const POKEMON_PER_BOX = 30;
  const POKEMON_SIZE = 58;
  const fullSectionsUsed = Math.floor((NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) / 4080);
  const leftoverBytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080;

  const pcData = Buffer.alloc(4080 * fullSectionsUsed + leftoverBytes + 4);

  sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
    const startOffset = i * 4080;
    const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4;
    pcData.set(sector.data.slice(0, length), startOffset);
  });

  // Parse boxes
  console.log('=== BOX POKEMON ===\n');
  let totalCount = 0;
  let shownCount = 0;
  const maxToShow = 20;

  for (let boxIdx = 0; boxIdx < NUM_BOXES; boxIdx++) {
    for (let slotIdx = 0; slotIdx < POKEMON_PER_BOX; slotIdx++) {
      const monIndex = boxIdx * POKEMON_PER_BOX + slotIdx;
      const offset = 4 + monIndex * POKEMON_SIZE;
      const pokemonBytes = pcData.slice(offset, offset + POKEMON_SIZE);

      const pokemon = parsePokemon(pokemonBytes);
      if (pokemon) {
        totalCount++;

        if (shownCount < maxToShow) {
          console.log(`\n--- Pokemon #${totalCount} (Box ${boxIdx + 1}, Slot ${slotIdx + 1}) ---`);
          console.log(`Species: ${pokemon.speciesName} (#${pokemon.speciesIndex})`);
          console.log(`Nickname: ${pokemon.nickname}`);
          console.log(`Level: ${pokemon.level} (EXP: ${pokemon.exp})`);
          console.log(`Base Stats: HP ${pokemon.baseStats.hp}, ATK ${pokemon.baseStats.atk}, DEF ${pokemon.baseStats.def}, SPA ${pokemon.baseStats.spa}, SPD ${pokemon.baseStats.spd}, SPE ${pokemon.baseStats.spe}`);
          console.log(`Calculated Stats: HP ${pokemon.stats.hp}, ATK ${pokemon.stats.attack}, DEF ${pokemon.stats.defense}, SPA ${pokemon.stats.spAtk}, SPD ${pokemon.stats.spDef}, SPE ${pokemon.stats.speed}`);
          console.log(`IVs: HP ${pokemon.ivs.hp}, ATK ${pokemon.ivs.attack}, DEF ${pokemon.ivs.defense}, SPA ${pokemon.ivs.spAtk}, SPD ${pokemon.ivs.spDef}, SPE ${pokemon.ivs.speed}`);
          console.log(`EVs: HP ${pokemon.evs.hp}, ATK ${pokemon.evs.attack}, DEF ${pokemon.evs.defense}, SPA ${pokemon.evs.spAtk}, SPD ${pokemon.evs.spDef}, SPE ${pokemon.evs.speed}`);
          console.log(`Moves:`);
          pokemon.moves.forEach((move, i) => {
            console.log(`  ${i + 1}. ${move.name} (ID: ${move.id})`);
          });
          shownCount++;
        }
      }
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Total Pokemon found: ${totalCount}`);
  console.log(`Shown: ${shownCount} of ${totalCount}`);
  if (totalCount > maxToShow) {
    console.log(`(Limited output to first ${maxToShow} Pokemon)`);
  }
}

// Run the test
const saveFilePath = process.argv[2] || './completed_rr.sav';
parseSave(saveFilePath);
