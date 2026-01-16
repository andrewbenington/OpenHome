import { PokemonData, Gender, OriginGame, BaseStats } from './types'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian, uint16ToBytesLittleEndian, uint32ToBytesLittleEndian } from './byteLogic'
import { gen3StringToUTF, utf8ToGen3String } from './stringConversion'
import speciesDataRaw from './species-data.json'
import movesDataRaw from './moves-data.json'

const speciesData = speciesDataRaw as Record<string, any>
const movesData = movesDataRaw as Record<string, any>

const FAKEMON_INDEXES = [
  1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
  1290, 1291, 1292, 1293, 1294, 1375,
]

// Experience curves for level calculation
const EXPERIENCE_CURVES: Record<string, number[]> = {
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
}

function calculateLevel(exp: number, levelUpType: string): number {
  const curve = EXPERIENCE_CURVES[levelUpType] || EXPERIENCE_CURVES['Medium Fast']

  for (let level = 1; level <= 100; level++) {
    if (exp < curve[level]) {
      return level
    }
  }
  return 100
}

function getSpeciesInfo(speciesIndex: number): { name: string; baseStats: BaseStats; levelUpType: string } {
  const species = speciesData[speciesIndex]
  if (!species) {
    return {
      name: `Unknown (${speciesIndex})`,
      baseStats: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
      levelUpType: 'Medium Fast'
    }
  }

  const forme = species.formes?.[0]
  return {
    name: species.name,
    baseStats: forme?.baseStats || { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 },
    levelUpType: species.levelUpType || 'Medium Fast'
  }
}

function getMoveName(moveId: number): string {
  const move = movesData[moveId]
  return move ? move.name : `Unknown (${moveId})`
}

// Helper to read bits from buffer
const getBits = (bytes: Uint8Array, offset: number, bitOffset: number, bitLength: number): number => {
  const byteIndex = offset
  const byte1 = bytes[byteIndex] || 0
  const byte2 = bytes[byteIndex + 1] || 0
  const combined = byte1 | (byte2 << 8)
  const mask = (1 << bitLength) - 1
  return (combined >> bitOffset) & mask
}

// Helper to write bits to buffer
const setBits = (bytes: Uint8Array, offset: number, bitOffset: number, bitLength: number, value: number): void => {
  const byteIndex = offset
  const byte1 = bytes[byteIndex] || 0
  const byte2 = bytes[byteIndex + 1] || 0
  let combined = byte1 | (byte2 << 8)

  const mask = (1 << bitLength) - 1
  combined = (combined & ~(mask << bitOffset)) | ((value & mask) << bitOffset)

  bytes[byteIndex] = combined & 0xff
  bytes[byteIndex + 1] = (combined >> 8) & 0xff
}

export const parsePokemon = (bytes: Uint8Array): PokemonData | null => {
  if (bytes.length < 58) return null

  // Check if Pokemon exists (species must be > 0)
  const speciesIndex = bytesToUint16LittleEndian(bytes, 0x1c)
  if (speciesIndex === 0) return null

  // Basic data structure based on CFRU format
  const personalityValue = bytesToUint32LittleEndian(bytes, 0x00)
  const trainerID = bytesToUint16LittleEndian(bytes, 0x04)
  const secretID = bytesToUint16LittleEndian(bytes, 0x06)
  const nickname = gen3StringToUTF(bytes, 0x08, 10)
  const trainerName = gen3StringToUTF(bytes, 0x14, 7)

  // Get species information
  const speciesInfo = getSpeciesInfo(speciesIndex)
  const dexNum = speciesIndex
  const formNum = 0
  const speciesName = speciesInfo.name
  const baseStats = speciesInfo.baseStats

  // Held item
  const heldItem = bytesToUint16LittleEndian(bytes, 0x1e)

  // Experience
  const exp = bytesToUint32LittleEndian(bytes, 0x20)

  // Calculate level from experience using proper growth curve
  const level = calculateLevel(exp, speciesInfo.levelUpType)

  // PP Ups (2 bits each for 4 moves)
  const ppUpByte = bytes[0x24]
  const movePPUps = [
    ppUpByte & 0x3,
    (ppUpByte >> 2) & 0x3,
    (ppUpByte >> 4) & 0x3,
    (ppUpByte >> 6) & 0x3,
  ]

  // Friendship
  const friendship = bytes[0x25]

  // Pokeball
  const ball = bytes[0x26]

  // Moves (10 bits each, packed across 5 bytes starting at 0x27)
  const moves = [
    getBits(bytes, 0x27, 0, 10),
    getBits(bytes, 0x28, 2, 10),
    getBits(bytes, 0x29, 4, 10),
    getBits(bytes, 0x2a, 6, 10),
  ]

  // Move PP (estimate based on move - simplified)
  const movePP = moves.map(() => 20) // Simplified

  // EVs (6 bytes starting at 0x2c)
  const hpEV = bytes[0x2c]
  const attackEV = bytes[0x2d]
  const defenseEV = bytes[0x2e]
  const speedEV = bytes[0x2f]
  const spAtkEV = bytes[0x30]
  const spDefEV = bytes[0x31]

  // Pokerus
  // const pokerus = bytes[0x32]

  // Met location (2 bytes at 0x33)
  // const metLocation = bytesToUint16LittleEndian(bytes, 0x33)

  // Met level & origin (byte at 0x35)
  // const metLevelAndOrigin = bytes[0x35]
  // const metLevel = metLevelAndOrigin & 0x7f
  const gameOfOrigin = OriginGame.FireRed

  // IVs, egg, ability (4 bytes at 0x36)
  const ivData = bytesToUint32LittleEndian(bytes, 0x36)
  const hpIV = ivData & 0x1f
  const attackIV = (ivData >> 5) & 0x1f
  const defenseIV = (ivData >> 10) & 0x1f
  const speedIV = (ivData >> 15) & 0x1f
  const spAtkIV = (ivData >> 20) & 0x1f
  const spDefIV = (ivData >> 25) & 0x1f
  const isEgg = ((ivData >> 30) & 0x1) === 1
  const hasHiddenAbility = ((ivData >> 31) & 0x1) === 1

  // Calculate stats using actual base stats
  const calculateStat = (base: number, iv: number, ev: number, level: number, isHP: boolean) => {
    if (isHP) {
      return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10
    }
    return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5
  }

  const hp = calculateStat(baseStats.hp, hpIV, hpEV, level, true)
  const attack = calculateStat(baseStats.atk, attackIV, attackEV, level, false)
  const defense = calculateStat(baseStats.def, defenseIV, defenseEV, level, false)
  const spAtk = calculateStat(baseStats.spa, spAtkIV, spAtkEV, level, false)
  const spDef = calculateStat(baseStats.spd, spDefIV, spDefEV, level, false)
  const speed = calculateStat(baseStats.spe, speedIV, speedEV, level, false)

  // Map move IDs to names
  const moveNames = moves.map(moveId => getMoveName(moveId))

  // Gender from personality value (simplified)
  const genderThreshold = 127 // Varies by species
  const genderValue = personalityValue & 0xff
  const gender = genderValue <= genderThreshold ? Gender.Female : Gender.Male

  // Shiny check
  const shinyCheck = (trainerID ^ secretID ^ (personalityValue & 0xffff) ^ (personalityValue >> 16)) < 8
  const isShiny = shinyCheck

  // Nature from personality value
  const nature = personalityValue % 25

  // Ability (0 or 1 for normal abilities, 2 for hidden)
  const ability = hasHiddenAbility ? 2 : (personalityValue & 1)

  // Ribbons (simplified)
  const ribbons: number[] = []

  // Trainer gender from personality value's low bit
  const trainerGender = (personalityValue & 0x8000) ? Gender.Female : Gender.Male

  // Check if fakemon
  const isFakemon = FAKEMON_INDEXES.includes(speciesIndex)

  return {
    dexNum,
    formNum,
    speciesName,
    nickname,
    level,
    exp,
    baseStats,
    hp,
    attack,
    defense,
    spAtk,
    spDef,
    speed,
    hpIV,
    attackIV,
    defenseIV,
    spAtkIV,
    spDefIV,
    speedIV,
    hpEV,
    attackEV,
    defenseEV,
    spAtkEV,
    spDefEV,
    speedEV,
    moves,
    moveNames,
    movePP,
    movePPUps,
    ability,
    nature,
    heldItem,
    gender,
    isShiny,
    friendship,
    isEgg,
    trainerName,
    trainerID,
    secretID,
    trainerGender,
    gameOfOrigin,
    ball,
    ribbons,
    isFakemon,
  }
}

export const serializePokemon = (pokemon: PokemonData, originalBytes: Uint8Array): Uint8Array => {
  const bytes = new Uint8Array(originalBytes)

  // Update personality value for nature and shiny changes
  let personalityValue = bytesToUint32LittleEndian(originalBytes, 0x00)
  const originalNature = ((personalityValue % 25) + 25) % 25 // Handle negative modulo
  const originalPersonalityValue = personalityValue

  // Check if nature needs to be changed
  if (pokemon.nature !== originalNature) {
    // Adjust personality value to set the correct nature
    const diff = (pokemon.nature - originalNature + 25) % 25
    personalityValue = (personalityValue + diff) >>> 0 // Ensure unsigned 32-bit
  }

  // Check if shiny status needs to be changed
  const trainerID = pokemon.trainerID
  const secretID = pokemon.secretID
  const currentShiny = (trainerID ^ secretID ^ (personalityValue & 0xffff) ^ (personalityValue >>> 16)) < 8

  if (pokemon.isShiny !== currentShiny) {
    if (pokemon.isShiny) {
      // Make it shiny by setting the lower 16 bits to create XOR result of 0
      const targetXor = trainerID ^ secretID
      const upperHalf = (personalityValue >>> 16) & 0xffff
      const lowerHalf = (upperHalf ^ targetXor) & 0xffff
      personalityValue = ((upperHalf << 16) | lowerHalf) >>> 0
    } else {
      // Make it not shiny by ensuring XOR result is >= 8
      const xorResult = (trainerID ^ secretID ^ (personalityValue & 0xffff) ^ (personalityValue >>> 16))
      if (xorResult < 8) {
        // Add 8 to the lower half to make XOR result >= 8
        const lowerHalf = ((personalityValue & 0xffff) + 8) & 0xffff
        personalityValue = ((personalityValue & 0xffff0000) | lowerHalf) >>> 0
      }
    }
  }

  // Write personality value if it changed
  if (personalityValue !== originalPersonalityValue) {
    bytes.set(uint32ToBytesLittleEndian(personalityValue), 0x00)
  }

  // Update nickname
  const nicknameBytes = utf8ToGen3String(pokemon.nickname, 10)
  bytes.set(nicknameBytes, 0x08)

  // Update trainer name
  const trainerNameBytes = utf8ToGen3String(pokemon.trainerName, 7)
  bytes.set(trainerNameBytes, 0x14)

  // Update held item
  bytes.set(uint16ToBytesLittleEndian(pokemon.heldItem), 0x1e)

  // Update experience
  bytes.set(uint32ToBytesLittleEndian(pokemon.exp), 0x20)

  // Update PP Ups
  const ppUpByte =
    (pokemon.movePPUps[0] & 0x3) |
    ((pokemon.movePPUps[1] & 0x3) << 2) |
    ((pokemon.movePPUps[2] & 0x3) << 4) |
    ((pokemon.movePPUps[3] & 0x3) << 6)
  bytes[0x24] = ppUpByte

  // Update friendship
  bytes[0x25] = pokemon.friendship

  // Update ball
  bytes[0x26] = pokemon.ball

  // Update moves
  setBits(bytes, 0x27, 0, 10, pokemon.moves[0])
  setBits(bytes, 0x28, 2, 10, pokemon.moves[1])
  setBits(bytes, 0x29, 4, 10, pokemon.moves[2])
  setBits(bytes, 0x2a, 6, 10, pokemon.moves[3])

  // Update EVs
  bytes[0x2c] = pokemon.hpEV
  bytes[0x2d] = pokemon.attackEV
  bytes[0x2e] = pokemon.defenseEV
  bytes[0x2f] = pokemon.speedEV
  bytes[0x30] = pokemon.spAtkEV
  bytes[0x31] = pokemon.spDefEV

  // Update IVs
  const ivData =
    (pokemon.hpIV & 0x1f) |
    ((pokemon.attackIV & 0x1f) << 5) |
    ((pokemon.defenseIV & 0x1f) << 10) |
    ((pokemon.speedIV & 0x1f) << 15) |
    ((pokemon.spAtkIV & 0x1f) << 20) |
    ((pokemon.spDefIV & 0x1f) << 25) |
    ((pokemon.isEgg ? 1 : 0) << 30) |
    ((pokemon.ability === 2 ? 1 : 0) << 31)

  bytes.set(uint32ToBytesLittleEndian(ivData), 0x36)

  return bytes
}
