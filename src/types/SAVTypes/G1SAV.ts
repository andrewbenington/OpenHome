import { PK1 } from '@pokemon-files/pkm'
import lodash from 'lodash'
import { GameOfOrigin, GameOfOriginData, Languages } from 'pokemon-resources'
import { NationalDex } from 'pokemon-species-data'
import { GEN1_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import { bytesToUint16BigEndian, get8BitChecksum } from 'src/util/byteLogic'
import { natDexToGen1ID } from 'src/util/ConvertPokemonID'
import { gen12StringToUTF, utf16StringToGen12 } from 'src/util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { PathData } from './path'
import { Box, BoxCoordinates, SAV } from './SAV'
import { LOOKUP_TYPE } from './util'

const SAVE_SIZE_BYTES = 0x8000

export class G1SAV implements SAV<PK1> {
  static pkmType = PK1

  static transferRestrictions = GEN1_TRANSFER_RESTRICTIONS
  static lookupType: LOOKUP_TYPE = 'gen12'

  NUM_BOXES = 14

  CURRENT_BOX_NUM_OFFSET = 0x284c

  CURRENT_BOX_DATA_OFFSET = 0x30c0

  BOX_SIZE = 0x462

  BOX_PKM_OFFSET = 0x16

  BOX_PKM_SIZE = 0x21

  BOX_OT_OFFSET = 0x2aa

  BOX_NICKNAME_OFFSET = 0x386

  origin: GameOfOrigin = GameOfOrigin.Red // TODO: game detection
  isPlugin: false = false

  boxRows = 4
  boxColumns = 5

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: set money for gen 1 saves
  name: string
  tid: number
  displayID: string

  currentPCBox: number
  boxes: Array<Box<PK1>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array, fileCreated?: Date) {
    this.bytes = bytes
    this.filePath = path
    this.fileCreated = fileCreated
    this.tid = bytesToUint16BigEndian(this.bytes, 0x2605)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.name = gen12StringToUTF(this.bytes, 0x2598, 11)

    this.currentPCBox = this.bytes[this.CURRENT_BOX_NUM_OFFSET] & 0x7f
    this.boxes = new Array(this.NUM_BOXES)

    if (this.currentPCBox > this.NUM_BOXES) {
      this.invalid = true
      return
    }
    let currenBoxByteOffset

    if (this.currentPCBox < 6) {
      currenBoxByteOffset = 0x4000 + this.currentPCBox * this.BOX_SIZE
    } else {
      currenBoxByteOffset = 0x6000 + (this.currentPCBox - 6) * this.BOX_SIZE
    }
    this.bytes.set(
      this.bytes.slice(this.CURRENT_BOX_DATA_OFFSET, this.CURRENT_BOX_DATA_OFFSET + this.BOX_SIZE),
      currenBoxByteOffset
    )

    if (this.bytes[0x271c] > 0 || path.name.toLowerCase().includes('yellow')) {
      // pikachu friendship
      this.origin = GameOfOrigin.Yellow
    } else if (path.name.toLowerCase().includes('blue')) {
      this.origin = GameOfOrigin.BlueGreen
    } else {
      this.origin = GameOfOrigin.Red
    }
    const pokemonPerBox = this.boxRows * this.boxColumns

    lodash.range(this.NUM_BOXES).forEach((boxNumber) => {
      this.boxes[boxNumber] = new Box(`Box ${boxNumber + 1}`, pokemonPerBox)
      let boxByteOffset

      if (boxNumber < 6) {
        boxByteOffset = 0x4000 + boxNumber * this.BOX_SIZE
      } else {
        boxByteOffset = 0x6000 + (boxNumber - 6) * this.BOX_SIZE
      }
      for (let monIndex = 0; monIndex < pokemonPerBox; monIndex++) {
        if (this.bytes[boxByteOffset + this.BOX_PKM_OFFSET + monIndex * this.BOX_PKM_SIZE]) {
          try {
            const mon = new PK1(
              this.bytes.slice(
                boxByteOffset + this.BOX_PKM_OFFSET + monIndex * this.BOX_PKM_SIZE,
                boxByteOffset + this.BOX_PKM_OFFSET + (monIndex + 1) * this.BOX_PKM_SIZE
              ).buffer
            )

            mon.trainerName = gen12StringToUTF(
              this.bytes,
              boxByteOffset + this.BOX_OT_OFFSET + monIndex * 11,
              11
            )
            mon.nickname = gen12StringToUTF(
              this.bytes,
              boxByteOffset + this.BOX_NICKNAME_OFFSET + monIndex * 11,
              11
            )
            mon.gameOfOrigin = this.origin
            mon.languageIndex = Languages.indexOf('ENG')
            this.boxes[boxNumber].pokemon[monIndex] = mon
          } catch (e) {
            console.error(e)
          }
        }
      }
    })
  }
  sid?: number | undefined
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculatePcChecksum?: (() => number) | undefined

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []
    const changedBoxes: number[] = lodash.uniq(this.updatedBoxSlots.map((coords) => coords.box))
    const pokemonPerBox = this.boxRows * this.boxColumns

    changedBoxes.forEach((boxNumber) => {
      let boxByteOffset: number

      if (boxNumber < 6) {
        boxByteOffset = 0x4000 + boxNumber * this.BOX_SIZE
      } else {
        boxByteOffset = 0x6000 + (boxNumber - 6) * this.BOX_SIZE
      }
      const box = this.boxes[boxNumber]
      let numMons = 0

      box.pokemon.forEach((boxMon) => {
        if (boxMon) {
          if (boxMon instanceof OHPKM) {
            changedMonPKMs.push(boxMon)
          }
          const pk1Mon = boxMon instanceof PK1 ? boxMon : new PK1(boxMon)

          // set the mon's dex number in the box
          this.bytes[boxByteOffset + 1 + numMons] = natDexToGen1ID[pk1Mon.dexNum]
          // set the mon's data in the box
          this.bytes.set(
            new Uint8Array(pk1Mon.toBytes()),
            boxByteOffset + this.BOX_PKM_OFFSET + numMons * this.BOX_PKM_SIZE
          )
          // set the mon's OT name in the box
          const trainerNameBuffer = utf16StringToGen12(pk1Mon.trainerName, 11, true)

          this.bytes.set(trainerNameBuffer, boxByteOffset + this.BOX_OT_OFFSET + numMons * 11)
          // set the mon's nickname in the box
          const nicknameBuffer = utf16StringToGen12(pk1Mon.nickname, 11, true)

          this.bytes.set(nicknameBuffer, boxByteOffset + this.BOX_NICKNAME_OFFSET + numMons * 11)
          numMons++
        }
      })

      this.bytes[boxByteOffset] = numMons
      const remainingSlots = pokemonPerBox - numMons

      if (remainingSlots) {
        // set all mon data to all 0s
        this.bytes.set(
          new Uint8Array(this.BOX_PKM_SIZE * remainingSlots),
          boxByteOffset + this.BOX_PKM_OFFSET + numMons * this.BOX_PKM_SIZE
        )
        // set all OT names to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset + this.BOX_OT_OFFSET + numMons * 11
        )
        // set all nicknames to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset + this.BOX_NICKNAME_OFFSET + numMons * 11
        )
      }
      // set all dex numbers to 0xFF or add terminator
      this.bytes.set(new Uint8Array(remainingSlots + 1).fill(0xff), boxByteOffset + 1 + numMons)
      let boxChecksumOffset

      if (boxNumber < 6) {
        boxChecksumOffset = 0x5a4d + boxNumber
      } else {
        boxChecksumOffset = 0x7a4d + boxNumber
      }
      const boxChecksum =
        get8BitChecksum(this.bytes, boxByteOffset, boxByteOffset + this.BOX_SIZE) ^ 0xff

      this.bytes[boxChecksumOffset] = boxChecksum
      if (boxNumber === this.currentPCBox) {
        this.bytes.set(
          this.bytes.slice(boxByteOffset, boxByteOffset + this.BOX_SIZE),
          this.CURRENT_BOX_DATA_OFFSET
        )
      }
    })
    const bank2Checksum = get8BitChecksum(this.bytes, 0x4000, 0x5a4c) ^ 0xff

    this.bytes[0x5a4c] = bank2Checksum
    const bank3Checksum = get8BitChecksum(this.bytes, 0x6000, 0x7a4c) ^ 0xff

    this.bytes[0x7a4c] = bank3Checksum
    const wholeSaveChecksum = get8BitChecksum(this.bytes, 0x2598, 0x3521) ^ 0xff

    this.bytes[0x3523] = wholeSaveChecksum
    return changedMonPKMs
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return dexNumber <= NationalDex.Mew && formeNumber === 0
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]

    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
  }

  static saveTypeAbbreviation = 'RBY (Int)'
  static saveTypeName = 'Pokémon Red/Blue/Yellow (INT)'
  static saveTypeID = 'G1SAV'

  static fileIsSave(bytes: Uint8Array): boolean {
    // Gen 1 and Gen 2 saves are the same size, so assume it's Gen 2 if the Gen 2 checksums are valid
    if (areCrystalInternationalChecksumsValid(bytes) || areGoldSilverChecksumsValid(bytes)) {
      return false
    }
    const decodedFirst64 = new TextDecoder('utf-8').decode(bytes.slice(0, 64))

    if (decodedFirst64.includes('Metroid') || decodedFirst64.includes('ZeroMission')) {
      // lol
      return false
    }
    return bytes.length === SAVE_SIZE_BYTES
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.Red:
        return '#DA3914'
      case GameOfOrigin.BlueGreen:
      case GameOfOrigin.BlueJapan:
        return '#2E50D8'
      case GameOfOrigin.Yellow:
        return '#FFD733'
      default:
        return '#666666'
    }
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin >= GameOfOrigin.Red && origin <= GameOfOrigin.Yellow
  }

  getPluginIdentifier() {
    return undefined
  }
}

function areGoldSilverChecksumsValid(bytes: Uint8Array) {
  const checksum1 = getGoldSilverInternationalChecksum1(bytes)

  if (checksum1 !== bytes[0x2d69]) {
    return false
  }
  const checksum2 = getGoldSilverInternationalChecksum2(bytes)

  return checksum2 === bytes[0x7e6d]
}

function getGoldSilverInternationalChecksum1(bytes: Uint8Array) {
  return get8BitChecksum(bytes, 0x2009, 0x2d68)
}

function getGoldSilverInternationalChecksum2(bytes: Uint8Array) {
  let checksum = 0

  checksum += get8BitChecksum(bytes, 0x15c7, 0x17ec)
  checksum += get8BitChecksum(bytes, 0x3d96, 0x3f3f)
  checksum += get8BitChecksum(bytes, 0x0c6b, 0x10e7)
  checksum += get8BitChecksum(bytes, 0x7e39, 0x7e6c)
  checksum += get8BitChecksum(bytes, 0x10e8, 0x15c6)
  return checksum & 0xff
}

function getCrystalInternationalChecksum1(bytes: Uint8Array) {
  return get8BitChecksum(bytes, 0x2009, 0x2b82)
}

function getCrystalInternationalChecksum2(bytes: Uint8Array) {
  return get8BitChecksum(bytes, 0x1209, 0x1d82)
}

function areCrystalInternationalChecksumsValid(bytes: Uint8Array) {
  const checksum1 = getCrystalInternationalChecksum1(bytes)

  if (checksum1 !== bytes[0x2d0d]) {
    return false
  }
  const checksum2 = getCrystalInternationalChecksum2(bytes)

  return checksum2 === bytes[0x1f0d]
}
