import { ItemGen2, Language, OriginGame } from '@pkm-rs-resources/pkg'
import { PK2 } from '@pokemon-files/pkm'
import { uniq } from 'lodash'
import { EXCLAMATION } from 'src/consts/Formes'
import { NationalDex } from 'src/consts/NationalDex'
import { GEN2_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import { bytesToUint16BigEndian, get8BitChecksum } from 'src/util/byteLogic'
import { gen12StringToUTF, utf16StringToGen12 } from 'src/util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { emptyPathData, PathData } from './path'
import { Box, BoxCoordinates, OfficialSAV } from './SAV'
import { LOOKUP_TYPE } from './util'

const CURRENT_BOX_OFFSET_GS_INTL = 0x2724
const CURRENT_BOX_OFFSET_C_INTL = 0x2700
const SAVE_SIZE_BYTES = 0x8000

export class G2SAV extends OfficialSAV<PK2> {
  static pkmType = PK2
  boxOffsets: number[]

  static transferRestrictions = GEN2_TRANSFER_RESTRICTIONS
  static lookupType: LOOKUP_TYPE = 'gen12'

  origin: OriginGame = OriginGame.Gold
  isPlugin: false = false

  boxRows = 4
  boxColumns = 5

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: set money for gen 2 saves
  name: string
  tid: number
  displayID: string

  currentPCBox: number
  boxes: Array<Box<PK2>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array, fileCreated?: Date) {
    super()
    this.bytes = bytes
    this.filePath = path
    this.fileCreated = fileCreated
    this.tid = bytesToUint16BigEndian(this.bytes, 0x2009)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.name = gen12StringToUTF(this.bytes, 0x200b, 11)
    this.boxOffsets = [
      0x4000, 0x4450, 0x48a0, 0x4cf0, 0x5140, 0x5590, 0x59e0, 0x6000, 0x6450, 0x68a0, 0x6cf0,
      0x7140, 0x7590, 0x79e0,
    ]
    this.boxes = []
    if (this.areGoldSilverChecksumsValid()) {
      // hacky but unavoidable
      if (this.filePath.name.toUpperCase().includes('SILVER')) {
        this.origin = OriginGame.Silver
      } else {
        this.origin = OriginGame.Gold
      }
    } else if (this.areCrystalInternationalChecksumsValid()) {
      this.origin = OriginGame.Crystal
    }

    this.currentPCBox =
      this.origin === OriginGame.Crystal
        ? this.bytes[CURRENT_BOX_OFFSET_C_INTL]
        : this.bytes[CURRENT_BOX_OFFSET_GS_INTL]

    this.boxes = new Array<Box<PK2>>(this.boxOffsets.length)

    const pokemonPerBox = this.boxRows * this.boxColumns

    this.boxOffsets.forEach((offset, boxNumber) => {
      const monCount = bytes[offset]

      this.boxes[boxNumber] = new Box(`Box ${boxNumber + 1}`, pokemonPerBox)
      for (let monIndex = 0; monIndex < monCount; monIndex++) {
        const mon = new PK2(
          this.bytes.slice(
            offset + 1 + pokemonPerBox + 1 + monIndex * 0x20,
            offset + 1 + pokemonPerBox + 1 + (monIndex + 1) * 0x20
          ).buffer
        )

        mon.trainerName = gen12StringToUTF(
          this.bytes,
          offset + 1 + pokemonPerBox + 1 + pokemonPerBox * 0x20 + monIndex * 11,
          11
        )
        mon.nickname = gen12StringToUTF(
          this.bytes,
          offset +
            1 +
            pokemonPerBox +
            1 +
            pokemonPerBox * 0x20 +
            pokemonPerBox * 11 +
            monIndex * 11,
          11
        )
        mon.gameOfOrigin = mon.metLevel ? OriginGame.Crystal : this.origin
        mon.language = Language.English
        this.boxes[boxNumber].pokemon[monIndex] = mon
      }
    })
  }
  pluginIdentifier?: string | undefined
  sid?: number | undefined
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculatePcChecksum?: (() => number) | undefined

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []
    const changedBoxes = uniq(this.updatedBoxSlots.map((coords) => coords.box))
    const pokemonPerBox = this.boxRows * this.boxColumns

    changedBoxes.forEach((boxNumber) => {
      const boxByteOffset = this.boxOffsets[boxNumber]
      const box = this.boxes[boxNumber]
      // functions as an index, to skip empty slots
      let numMons = 0

      box.pokemon.forEach((boxMon) => {
        if (boxMon) {
          if (boxMon instanceof OHPKM) {
            changedMonPKMs.push(boxMon)
          }
          const pk2Mon = boxMon instanceof PK2 ? boxMon : new PK2(boxMon)

          // set the mon's dex number in the box (separate location)
          this.bytes[boxByteOffset + 1 + numMons] = pk2Mon.dexNum
          // set the mon's data in the box
          this.bytes.set(
            new Uint8Array(pk2Mon.toBytes().slice(0, 32)),
            boxByteOffset + 1 + pokemonPerBox + 1 + numMons * 0x20
          )
          // set the mon's OT name in the box
          const trainerNameBuffer = utf16StringToGen12(pk2Mon.trainerName, 11, true)

          this.bytes.set(
            trainerNameBuffer,
            boxByteOffset + 1 + pokemonPerBox + 1 + pokemonPerBox * 0x20 + numMons * 11
          )
          // set the mon's nickname in the box
          const nicknameBuffer = utf16StringToGen12(pk2Mon.nickname, 11, true)

          this.bytes.set(
            nicknameBuffer,
            boxByteOffset +
              1 +
              pokemonPerBox +
              1 +
              pokemonPerBox * 0x20 +
              pokemonPerBox * 11 +
              numMons * 11
          )
          numMons++
        }
      })
      this.bytes[boxByteOffset] = numMons
      const remainingSlots = pokemonPerBox - numMons

      if (remainingSlots) {
        // set all dex numbers to 0
        this.bytes.set(new Uint8Array(remainingSlots + 1), boxByteOffset + 1 + numMons)
        // set all mon data to all 0s
        this.bytes.set(
          new Uint8Array(0x20 * remainingSlots),
          boxByteOffset + 1 + pokemonPerBox + 1 + numMons * 0x20
        )
        // set all OT names to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset + 1 + pokemonPerBox + 1 + pokemonPerBox * 0x20 + numMons * 11
        )
        // set all nicknames to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset +
            1 +
            pokemonPerBox +
            1 +
            pokemonPerBox * 0x20 +
            pokemonPerBox * 11 +
            numMons * 11
        )
      }
      // add terminator
      this.bytes[boxByteOffset + 1 + numMons] = 0xff
    })
    switch (this.origin) {
      case OriginGame.Gold:
      case OriginGame.Silver:
        this.bytes[0x2d69] = this.getGoldSilverInternationalChecksum1()
        this.bytes[0x7e6d] = this.getGoldSilverInternationalChecksum2()
        break
      case OriginGame.Crystal:
        this.bytes.set(this.bytes.slice(0x2009, 0x2b82), 0x1209)
        this.bytes[0x2d0d] = this.getCrystalInternationalChecksum1()
        this.bytes[0x1f0d] = this.getCrystalInternationalChecksum2()
        break
    }
    return changedMonPKMs
  }

  areGoldSilverChecksumsValid() {
    const checksum1 = this.getGoldSilverInternationalChecksum1()

    if (checksum1 !== this.bytes[0x2d69]) {
      return false
    }
    const checksum2 = this.getGoldSilverInternationalChecksum2()

    return checksum2 === this.bytes[0x7e6d]
  }

  getGoldSilverInternationalChecksum1() {
    return get8BitChecksum(this.bytes, 0x2009, 0x2d68)
  }

  getGoldSilverInternationalChecksum2() {
    let checksum = 0

    checksum += get8BitChecksum(this.bytes, 0x15c7, 0x17ec)
    checksum += get8BitChecksum(this.bytes, 0x3d96, 0x3f3f)
    checksum += get8BitChecksum(this.bytes, 0x0c6b, 0x10e7)
    checksum += get8BitChecksum(this.bytes, 0x7e39, 0x7e6c)
    checksum += get8BitChecksum(this.bytes, 0x10e8, 0x15c6)
    return checksum & 0xff
  }

  getCrystalInternationalChecksum1() {
    return get8BitChecksum(this.bytes, 0x2009, 0x2b82)
  }

  getCrystalInternationalChecksum2() {
    return get8BitChecksum(this.bytes, 0x1209, 0x1d82)
  }

  areCrystalInternationalChecksumsValid() {
    const checksum1 = this.getCrystalInternationalChecksum1()

    if (checksum1 !== this.bytes[0x2d0d]) {
      return false
    }
    const checksum2 = this.getCrystalInternationalChecksum2()

    return checksum2 === this.bytes[0x1f0d]
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return (
      (dexNumber <= NationalDex.Celebi && formeNumber === 0) ||
      (dexNumber === NationalDex.Unown && formeNumber < EXCLAMATION)
    )
  }

  supportsItem(itemIndex: number) {
    return ItemGen2.fromModern(itemIndex) !== undefined
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  static saveTypeAbbreviation = 'GSC (Int)'
  static saveTypeName = 'Pokémon Gold/Silver/Crystal (INT)'
  static saveTypeID = 'G2SAV'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES) {
      return false
    }
    try {
      const g2Save = new G2SAV(emptyPathData, bytes)

      return g2Save.areCrystalInternationalChecksumsValid() || g2Save.areGoldSilverChecksumsValid()
    } catch {
      return false
    }
  }

  static includesOrigin(origin: OriginGame) {
    return origin >= OriginGame.Gold && origin <= OriginGame.Crystal
  }
}
