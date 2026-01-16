import { PokemonData, Gender, OriginGame } from './types'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian, uint32ToBytesLittleEndian } from './byteLogic'
import { gen3StringToUTF, utf8ToGen3String } from './stringConversion'

const FAKEMON_INDEXES = [
  1186, 1200, 1274, 1275, 1276, 1277, 1278, 1279, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289,
  1290, 1291, 1292, 1293, 1294, 1375,
]

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

  // Species and forme
  const dexNum = speciesIndex // Simplified - in reality needs mapping
  const formNum = 0

  // Held item
  const heldItem = bytesToUint16LittleEndian(bytes, 0x1e)

  // Experience
  const exp = bytesToUint32LittleEndian(bytes, 0x20)

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

  // Calculate level from experience (simplified - using rough formula)
  const level = Math.floor(Math.pow(exp / 1000, 1/3)) + 1

  // Calculate stats (simplified Gen 3 formula)
  const calculateStat = (base: number, iv: number, ev: number, level: number, isHP: boolean) => {
    if (isHP) {
      return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10
    }
    return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5
  }

  // Using rough base stats (would need species lookup for accuracy)
  const baseStats = { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 }

  const hp = calculateStat(baseStats.hp, hpIV, hpEV, level, true)
  const attack = calculateStat(baseStats.atk, attackIV, attackEV, level, false)
  const defense = calculateStat(baseStats.def, defenseIV, defenseEV, level, false)
  const spAtk = calculateStat(baseStats.spa, spAtkIV, spAtkEV, level, false)
  const spDef = calculateStat(baseStats.spd, spDefIV, spDefEV, level, false)
  const speed = calculateStat(baseStats.spe, speedIV, speedEV, level, false)

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
    nickname,
    level,
    exp,
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

  // Update nickname
  const nicknameBytes = utf8ToGen3String(pokemon.nickname, 10)
  bytes.set(nicknameBytes, 0x08)

  // Update trainer name
  const trainerNameBytes = utf8ToGen3String(pokemon.trainerName, 7)
  bytes.set(trainerNameBytes, 0x14)

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
