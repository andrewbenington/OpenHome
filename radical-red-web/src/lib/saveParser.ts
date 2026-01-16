import { SaveData, Box } from './types'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian, uint16ToBytesLittleEndian, uint32ToBytesLittleEndian } from './byteLogic'
import { gen3StringToUTF } from './stringConversion'
import { parsePokemon, serializePokemon } from './pokemonParser'

const SAVE_SIZES_BYTES = [0x20000, 0x20010]
const POKEMON_SIZE = 58
const POKEMON_PER_BOX = 30
const NUM_BOXES = 18

interface Sector {
  data: Uint8Array
  sectionID: number
  checksum: number
  signature: number
  saveIndex: number
}

const parseSector = (bytes: Uint8Array, index: number): Sector => {
  const data = bytes.slice(index * 0x1000, index * 0x1000 + 4080)
  const sectionID = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff4)
  const checksum = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff6)
  const signature = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xff8)
  const saveIndex = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xffc)

  return { data, sectionID, checksum, signature, saveIndex }
}

const calculateSectorChecksum = (data: Uint8Array, sectionID: number): number => {
  let checksum = 0
  let byteLength = 0xff0

  if (sectionID === 0) {
    byteLength = 3884
  } else if (sectionID === 13) {
    byteLength = 2000
  }

  for (let i = 0; i < byteLength; i += 4) {
    checksum += bytesToUint32LittleEndian(data, i)
    checksum = checksum & 0xffffffff
  }

  return ((checksum & 0xffff) + ((checksum >> 16) & 0xffff)) & 0xffff
}

export const isRadicalRedSave = (bytes: Uint8Array): boolean => {
  if (!SAVE_SIZES_BYTES.includes(bytes.length)) {
    return false
  }

  // Radical Red has security key set to 0 or mismatched security keys
  const securityKey = bytesToUint32LittleEndian(bytes, 0xf20)
  const securityKeyCopy = bytesToUint32LittleEndian(bytes, 0xf24)

  return securityKey === 0 || securityKey !== securityKeyCopy
}

export const parseSave = (bytes: Uint8Array): SaveData => {
  console.log('=== SAVE PARSER DEBUG ===')
  console.log('Save file size:', bytes.length)

  // Parse all 14 sectors from the first save slot
  const sectors: Sector[] = []
  for (let i = 0; i < 14; i++) {
    sectors.push(parseSector(bytes, i))
  }

  console.log('Sectors before sorting:', sectors.map(s => ({ sectionID: s.sectionID, saveIndex: s.saveIndex })))

  // Sort sectors by section ID
  sectors.sort((a, b) => a.sectionID - b.sectionID)

  console.log('Sectors after sorting:', sectors.map(s => ({ sectionID: s.sectionID, saveIndex: s.saveIndex })))

  // Extract trainer info from sector 0
  const trainerName = gen3StringToUTF(sectors[0].data, 0x00, 7)
  const trainerID = bytesToUint16LittleEndian(sectors[0].data, 0x0a)
  const secretID = bytesToUint16LittleEndian(sectors[0].data, 0x0c)
  const securityKey = bytesToUint32LittleEndian(sectors[0].data, 0xaf8)
  const money = bytesToUint32LittleEndian(sectors[1].data, 0x290) ^ securityKey

  console.log('Trainer Info:')
  console.log('  Name:', trainerName)
  console.log('  ID:', trainerID)
  console.log('  Secret ID:', secretID)
  console.log('  Money:', money)
  console.log('  Security Key:', securityKey)

  // Concatenate PC data from sectors 5-11
  const fullSectionsUsed = Math.floor((NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) / 4080)
  const leftoverBytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080

  console.log('PC Data Info:')
  console.log('  Total PC bytes:', NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX)
  console.log('  Full sections used:', fullSectionsUsed)
  console.log('  Leftover bytes:', leftoverBytes)
  console.log('  PC sectors range:', `5-${5 + fullSectionsUsed}`)

  const pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4)

  sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
    const startOffset = i * 4080
    const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4
    pcDataContiguous.set(sector.data.slice(0, length), startOffset)
    console.log(`  Copying sector ${sector.sectionID}: ${length} bytes at offset ${startOffset}`)
  })

  // Parse boxes
  const boxes: Box[] = []
  let totalPokemonFound = 0

  for (let boxIdx = 0; boxIdx < NUM_BOXES; boxIdx++) {
    const box: Box = {
      name: `Box ${boxIdx + 1}`,
      pokemon: new Array(POKEMON_PER_BOX).fill(null),
    }

    for (let slotIdx = 0; slotIdx < POKEMON_PER_BOX; slotIdx++) {
      const monIndex = boxIdx * POKEMON_PER_BOX + slotIdx
      const offset = 4 + monIndex * POKEMON_SIZE
      const pokemonBytes = pcDataContiguous.slice(offset, offset + POKEMON_SIZE)

      try {
        const pokemon = parsePokemon(pokemonBytes)
        if (pokemon) {
          box.pokemon[slotIdx] = pokemon
          totalPokemonFound++

          // Log first 5 Pokemon
          if (totalPokemonFound <= 5) {
            console.log(`Pokemon ${totalPokemonFound}:`, {
              box: boxIdx,
              slot: slotIdx,
              species: pokemon.dexNum,
              nickname: pokemon.nickname,
              level: pokemon.level
            })
          }
        }
      } catch (e) {
        console.error(`Error parsing Pokemon at box ${boxIdx}, slot ${slotIdx}:`, e)
      }
    }

    boxes.push(box)
  }

  console.log('Total Pokemon found:', totalPokemonFound)
  console.log('=== END DEBUG ===')
  console.log('')

  return {
    boxes,
    trainerName,
    trainerID,
    secretID,
    money,
    updatedBoxSlots: [],
    bytes: new Uint8Array(bytes), // Clone the original bytes
  }
}

export const serializeSave = (saveData: SaveData): Uint8Array => {
  const bytes = new Uint8Array(saveData.bytes)

  // Parse sectors from the modified bytes
  const sectors: Sector[] = []
  for (let i = 0; i < 14; i++) {
    sectors.push(parseSector(bytes, i))
  }
  sectors.sort((a, b) => a.sectionID - b.sectionID)

  // Rebuild PC data for modified slots
  const fullSectionsUsed = Math.floor((NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) / 4080)
  const leftoverBytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080

  const pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4)

  // Copy existing PC data
  sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
    const startOffset = i * 4080
    const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4
    pcDataContiguous.set(sector.data.slice(0, length), startOffset)
  })

  // Update only the modified Pokemon slots
  saveData.updatedBoxSlots.forEach(({ box, index }) => {
    const pokemon = saveData.boxes[box].pokemon[index]
    const monIndex = box * POKEMON_PER_BOX + index
    const offset = 4 + monIndex * POKEMON_SIZE

    if (pokemon) {
      // Get original bytes to preserve structure
      const originalBytes = pcDataContiguous.slice(offset, offset + POKEMON_SIZE)
      // Serialize the modified Pokemon
      const serializedBytes = serializePokemon(pokemon, originalBytes)
      pcDataContiguous.set(serializedBytes, offset)
    } else {
      // Clear the slot
      pcDataContiguous.set(new Uint8Array(POKEMON_SIZE), offset)
    }
  })

  // Write PC data back to sectors
  sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
    const startOffset = i * 4080
    const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4
    sector.data.set(pcDataContiguous.slice(startOffset, startOffset + length), 0)

    // Recalculate checksum
    sector.checksum = calculateSectorChecksum(sector.data, sector.sectionID)
  })

  // Write sectors back to bytes
  const firstSectorIndex = sectors[0].sectionID
  sectors.forEach((sector, i) => {
    const physicalIndex = (i + 14 - firstSectorIndex) % 14

    bytes.set(sector.data, physicalIndex * 0x1000)
    bytes.set(uint16ToBytesLittleEndian(sector.sectionID), physicalIndex * 0x1000 + 0xff4)
    bytes.set(uint16ToBytesLittleEndian(sector.checksum), physicalIndex * 0x1000 + 0xff6)
    bytes.set(uint32ToBytesLittleEndian(sector.signature), physicalIndex * 0x1000 + 0xff8)
    bytes.set(uint32ToBytesLittleEndian(sector.saveIndex), physicalIndex * 0x1000 + 0xffc)
  })

  return bytes
}
