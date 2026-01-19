import { SaveData, Box, BagData, ItemSlot } from './types'
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian, uint16ToBytesLittleEndian, uint32ToBytesLittleEndian } from './byteLogic'
import { gen3StringToUTF, utf8ToGen3String } from './stringConversion'
import { parsePokemon, serializePokemon } from './pokemonParser'

const SAVE_SIZES_BYTES = [0x20000, 0x20010]
const SECTOR_SIZE = 0x1000
const SECTOR_DATA_SIZE = 0xff0
const POKEMON_SIZE = 58
const POKEMON_PER_BOX = 30
const NUM_BOXES = 18

const PARASITE_SIZES: Record<number, number> = {
  0: 0x0cc,
  4: 0x258,
  13: 0x0ba0,
}

const PARASITE_OFFSETS: Record<number, number> = {
  0: SECTOR_DATA_SIZE - PARASITE_SIZES[0],
  4: SECTOR_DATA_SIZE - PARASITE_SIZES[4],
  13: SECTOR_DATA_SIZE - PARASITE_SIZES[13],
}

const PARASITE_TOTAL_SIZE = 0xec4
const EXTRA_SAVE_DATA_SIZE = 0x2ea4
const BAG_DATA_OFFSET = 0x9ac
const BAG_ITEMS_COUNT = 450
const BAG_KEY_ITEMS_COUNT = 75
const BAG_BALLS_COUNT = 50
const BAG_TMS_COUNT = 128
const BAG_BERRIES_COUNT = 75

interface Sector {
  data: Uint8Array
  sectionID: number
  checksum: number
  signature: number
  saveIndex: number
}

const parseSector = (bytes: Uint8Array, index: number): Sector => {
  const data = bytes.slice(index * SECTOR_SIZE, index * SECTOR_SIZE + SECTOR_DATA_SIZE)
  const sectionID = bytesToUint16LittleEndian(bytes, index * SECTOR_SIZE + 0xff4)
  const checksum = bytesToUint16LittleEndian(bytes, index * SECTOR_SIZE + 0xff6)
  const signature = bytesToUint32LittleEndian(bytes, index * SECTOR_SIZE + 0xff8)
  const saveIndex = bytesToUint32LittleEndian(bytes, index * SECTOR_SIZE + 0xffc)

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

const parseItemSlots = (data: Uint8Array, offset: number, count: number): ItemSlot[] => {
  const slots: ItemSlot[] = []
  for (let i = 0; i < count; i++) {
    const base = offset + i * 4
    slots.push({
      itemId: bytesToUint16LittleEndian(data, base),
      quantity: bytesToUint16LittleEndian(data, base + 2),
    })
  }
  return slots
}

const writeItemSlots = (data: Uint8Array, offset: number, slots: ItemSlot[]) => {
  slots.forEach((slot, index) => {
    const base = offset + index * 4
    data.set(uint16ToBytesLittleEndian(slot.itemId), base)
    data.set(uint16ToBytesLittleEndian(slot.quantity), base + 2)
  })
}

const parseBagData = (extraData: Uint8Array): BagData => {
  let cursor = BAG_DATA_OFFSET

  const items = parseItemSlots(extraData, cursor, BAG_ITEMS_COUNT)
  cursor += BAG_ITEMS_COUNT * 4

  const keyItems = parseItemSlots(extraData, cursor, BAG_KEY_ITEMS_COUNT)
  cursor += BAG_KEY_ITEMS_COUNT * 4

  const balls = parseItemSlots(extraData, cursor, BAG_BALLS_COUNT)
  cursor += BAG_BALLS_COUNT * 4

  const tms = parseItemSlots(extraData, cursor, BAG_TMS_COUNT)
  cursor += BAG_TMS_COUNT * 4

  const berries = parseItemSlots(extraData, cursor, BAG_BERRIES_COUNT)

  return { items, keyItems, balls, tms, berries }
}

const writeBagData = (extraData: Uint8Array, bag: BagData) => {
  let cursor = BAG_DATA_OFFSET
  writeItemSlots(extraData, cursor, bag.items)
  cursor += BAG_ITEMS_COUNT * 4
  writeItemSlots(extraData, cursor, bag.keyItems)
  cursor += BAG_KEY_ITEMS_COUNT * 4
  writeItemSlots(extraData, cursor, bag.balls)
  cursor += BAG_BALLS_COUNT * 4
  writeItemSlots(extraData, cursor, bag.tms)
  cursor += BAG_TMS_COUNT * 4
  writeItemSlots(extraData, cursor, bag.berries)
}

const getExtraSaveData = (bytes: Uint8Array, sectors: Sector[]): Uint8Array => {
  const sectorMap = new Map(sectors.map((sector) => [sector.sectionID, sector]))
  const extraData = new Uint8Array(EXTRA_SAVE_DATA_SIZE)
  let cursor = 0

  ;[0, 4, 13].forEach((id) => {
    const sector = sectorMap.get(id)
    if (!sector) return
    const size = PARASITE_SIZES[id]
    const offset = PARASITE_OFFSETS[id]
    extraData.set(sector.data.slice(offset, offset + size), cursor)
    cursor += size
  })

  if (bytes.length >= SECTOR_SIZE * 32) {
    const sector30 = parseSector(bytes, 30)
    const sector31 = parseSector(bytes, 31)
    extraData.set(sector30.data, cursor)
    cursor += SECTOR_DATA_SIZE
    extraData.set(sector31.data, cursor)
  }

  return extraData
}

const writeExtraSaveData = (bytes: Uint8Array, sectors: Sector[], extraData: Uint8Array) => {
  const sectorMap = new Map(sectors.map((sector) => [sector.sectionID, sector]))
  let cursor = 0

  ;[0, 4, 13].forEach((id) => {
    const sector = sectorMap.get(id)
    if (!sector) return
    const size = PARASITE_SIZES[id]
    const offset = PARASITE_OFFSETS[id]
    sector.data.set(extraData.slice(cursor, cursor + size), offset)
    cursor += size
  })

  const sector30Start = PARASITE_TOTAL_SIZE
  const sector31Start = PARASITE_TOTAL_SIZE + SECTOR_DATA_SIZE

  if (bytes.length >= SECTOR_SIZE * 32) {
    const sector30 = parseSector(bytes, 30)
    const sector31 = parseSector(bytes, 31)
    sector30.data.set(extraData.slice(sector30Start, sector30Start + SECTOR_DATA_SIZE), 0)
    sector31.data.set(extraData.slice(sector31Start, sector31Start + SECTOR_DATA_SIZE), 0)
    bytes.set(sector30.data, 30 * SECTOR_SIZE)
    bytes.set(sector31.data, 31 * SECTOR_SIZE)
  }
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

  const extraData = getExtraSaveData(bytes, sectors)
  const bag = parseBagData(extraData)

  return {
    boxes,
    trainerName,
    trainerID,
    secretID,
    money,
    bag,
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

  const trainerSector = sectors.find((sector) => sector.sectionID === 0)
  const moneySector = sectors.find((sector) => sector.sectionID === 1)

  if (trainerSector) {
    const trainerNameBytes = utf8ToGen3String(saveData.trainerName, 7)
    trainerSector.data.set(trainerNameBytes, 0x00)
    trainerSector.data.set(uint16ToBytesLittleEndian(saveData.trainerID), 0x0a)
    trainerSector.data.set(uint16ToBytesLittleEndian(saveData.secretID), 0x0c)
  }

  if (trainerSector && moneySector) {
    const securityKey = bytesToUint32LittleEndian(trainerSector.data, 0xaf8)
    moneySector.data.set(
      uint32ToBytesLittleEndian(saveData.money ^ securityKey),
      0x290
    )
  }

  const extraData = getExtraSaveData(bytes, sectors)
  writeBagData(extraData, saveData.bag)
  writeExtraSaveData(bytes, sectors, extraData)

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

  if (trainerSector) {
    trainerSector.checksum = calculateSectorChecksum(trainerSector.data, trainerSector.sectionID)
  }

  if (moneySector) {
    moneySector.checksum = calculateSectorChecksum(moneySector.data, moneySector.sectionID)
  }

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
