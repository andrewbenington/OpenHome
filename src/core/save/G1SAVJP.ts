import { PK1, toGen1PokemonIndex } from '@openhome-core/pkm'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex'
import { GEN1_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { readGameBoyStringFromBytes } from '@openhome-core/util'
import { bytesToUint16BigEndian } from '@openhome-core/util/byteLogic'
import { Errorable, Option, range, unique } from '@openhome-core/util/functional'
import { utf16StringToGen12 } from '@openhome-core/util/stringConversion'
import {
  BinaryGender,
  ConvertStrategy,
  ExtraFormIndex,
  ItemGen1,
  Language,
  OriginGame,
} from '@pkm-rs/pkg'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxAndSlot, OfficialSAV } from './interfaces'
import { LookupType } from './util'
import {
  areGen2JapanCrystalChecksumsValid,
  areGen2JapanGoldSilverChecksumsValid,
  G1_JP_CHECKSUM_OFFSET,
  getGen1JapanChecksum,
  looksLikeGen1JapanSave,
} from './util/gbJapanChecksums'
import { PathData } from './util/path'

/**
 * Japanese Gen 1 saves are the same 32KB as international ones but use a
 * different main-data layout, 8 boxes of 30 (vs 12 of 20), 5-byte names
 * (+ terminator), and the Japanese character encoding. The box banks carry
 * no checksums; only the main data region is checksummed.
 */

const SAVE_SIZE_BYTES = 0x8000
const NAME_SIZE = 6 // 5 characters + terminator
const NUM_BOXES = 8
const BOXES_PER_BANK = 4
const BOX_CAPACITY = 30
const BOX_PKM_SIZE = 0x21
// count byte + species list (capacity + terminator) + mon structs + OTs + nicknames
const BOX_PKM_OFFSET = 1 + BOX_CAPACITY + 1
const BOX_OT_OFFSET = BOX_PKM_OFFSET + BOX_CAPACITY * BOX_PKM_SIZE
const BOX_NICKNAME_OFFSET = BOX_OT_OFFSET + BOX_CAPACITY * NAME_SIZE
const BOX_SIZE = BOX_NICKNAME_OFFSET + BOX_CAPACITY * NAME_SIZE // 0x566

// Japanese releases are titled ポケットモンスター 赤/緑/青/ピカチュウ
const YELLOW_TITLES = ['yellow', 'ピカチュウ']
const BLUE_TITLES = ['blue', '青']
const GREEN_TITLES = ['green', '緑']

const TRAINER_NAME_OFFSET = 0x2598
const TID_OFFSET = 0x25fb
const PIKA_FRIENDSHIP_OFFSET = 0x2712
const CURRENT_BOX_NUM_OFFSET = 0x2842
const CURRENT_BOX_DATA_OFFSET = 0x302d

function boxByteOffset(boxNumber: number): number {
  return boxNumber < BOXES_PER_BANK
    ? 0x4000 + boxNumber * BOX_SIZE
    : 0x6000 + (boxNumber - BOXES_PER_BANK) * BOX_SIZE
}

export class G1SAVJP extends OfficialSAV<PK1> {
  static pkmType = PK1

  static transferRestrictions = GEN1_TRANSFER_RESTRICTIONS
  static lookupType: LookupType = 'gen12'

  origin: OriginGame = OriginGame.Red
  isPlugin: false = false

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0
  name: string
  tid: number
  displayID: string
  language = Language.Japanese

  currentPCBox: number
  boxes: Array<Box<PK1>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super()
    this.bytes = bytes
    const dataView = new DataView(this.bytes.buffer)

    this.filePath = path
    this.tid = bytesToUint16BigEndian(this.bytes, TID_OFFSET)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.name = readGameBoyStringFromBytes(dataView, TRAINER_NAME_OFFSET, NAME_SIZE, 'Jpn')

    this.currentPCBox = this.bytes[CURRENT_BOX_NUM_OFFSET] & 0x7f
    this.boxes = new Array(NUM_BOXES)

    if (this.currentPCBox >= NUM_BOXES) {
      this.invalid = true
      return
    }
    // the banked copy of the active box is stale; the live copy is in main data
    this.bytes.set(
      this.bytes.slice(CURRENT_BOX_DATA_OFFSET, CURRENT_BOX_DATA_OFFSET + BOX_SIZE),
      boxByteOffset(this.currentPCBox)
    )

    const fileName = path.name.toLowerCase()
    const titled = (titles: string[]) => titles.some((title) => fileName.includes(title))

    if (this.bytes[PIKA_FRIENDSHIP_OFFSET] > 0 || titled(YELLOW_TITLES)) {
      this.origin = OriginGame.Yellow
    } else if (titled(BLUE_TITLES)) {
      this.origin = OriginGame.BlueJpn
    } else if (titled(GREEN_TITLES)) {
      this.origin = OriginGame.BlueGreen
    } else {
      this.origin = OriginGame.Red
    }

    range(NUM_BOXES).forEach((boxNumber) => {
      this.boxes[boxNumber] = new Box(`Box ${boxNumber + 1}`, BOX_CAPACITY)
      const boxOffset = boxByteOffset(boxNumber)

      for (let monIndex = 0; monIndex < BOX_CAPACITY; monIndex++) {
        if (this.bytes[boxOffset + BOX_PKM_OFFSET + monIndex * BOX_PKM_SIZE]) {
          try {
            const mon = PK1.fromBytes(
              this.bytes.slice(
                boxOffset + BOX_PKM_OFFSET + monIndex * BOX_PKM_SIZE,
                boxOffset + BOX_PKM_OFFSET + (monIndex + 1) * BOX_PKM_SIZE
              ).buffer
            )

            mon.trainerName = readGameBoyStringFromBytes(
              dataView,
              boxOffset + BOX_OT_OFFSET + monIndex * NAME_SIZE,
              NAME_SIZE,
              'Jpn'
            )
            mon.nickname = readGameBoyStringFromBytes(
              dataView,
              boxOffset + BOX_NICKNAME_OFFSET + monIndex * NAME_SIZE,
              NAME_SIZE,
              'Jpn'
            )
            mon.gameOfOrigin = this.origin
            mon.language = Language.Japanese
            this.boxes[boxNumber].boxSlots[monIndex] = mon
          } catch (e) {
            console.error(`G1SAVJP: ${e}`)
          }
        }
      }
    })
  }
  sid?: number | undefined

  prepareForSaving() {
    const changedBoxes: number[] = unique(this.updatedBoxSlots.map((coords) => coords.box))

    changedBoxes.forEach((boxNumber) => {
      const boxOffset = boxByteOffset(boxNumber)
      const box = this.boxes[boxNumber]
      let numMons = 0

      box.boxSlots.forEach((boxMon) => {
        if (boxMon) {
          this.bytes[boxOffset + 1 + numMons] = toGen1PokemonIndex(boxMon.nationalDex)
          this.bytes.set(
            new Uint8Array(boxMon.toBytes()),
            boxOffset + BOX_PKM_OFFSET + numMons * BOX_PKM_SIZE
          )
          const trainerNameBuffer = utf16StringToGen12(boxMon.trainerName, NAME_SIZE, true, 'Jpn')

          this.bytes.set(trainerNameBuffer, boxOffset + BOX_OT_OFFSET + numMons * NAME_SIZE)
          const nicknameBuffer = utf16StringToGen12(boxMon.nickname, NAME_SIZE, true, 'Jpn')

          this.bytes.set(nicknameBuffer, boxOffset + BOX_NICKNAME_OFFSET + numMons * NAME_SIZE)
          numMons++
        }
      })

      this.bytes[boxOffset] = numMons
      const remainingSlots = BOX_CAPACITY - numMons

      if (remainingSlots) {
        this.bytes.set(
          new Uint8Array(BOX_PKM_SIZE * remainingSlots),
          boxOffset + BOX_PKM_OFFSET + numMons * BOX_PKM_SIZE
        )
        this.bytes.set(
          new Uint8Array(NAME_SIZE * remainingSlots),
          boxOffset + BOX_OT_OFFSET + numMons * NAME_SIZE
        )
        this.bytes.set(
          new Uint8Array(NAME_SIZE * remainingSlots),
          boxOffset + BOX_NICKNAME_OFFSET + numMons * NAME_SIZE
        )
      }
      // species list terminator; remaining entries cleared to 0xFF
      this.bytes.set(new Uint8Array(remainingSlots + 1).fill(0xff), boxOffset + 1 + numMons)

      if (boxNumber === this.currentPCBox) {
        this.bytes.set(this.bytes.slice(boxOffset, boxOffset + BOX_SIZE), CURRENT_BOX_DATA_OFFSET)
      }
    })
    // Japanese box banks carry no checksums; only main data is checksummed,
    // which covers the live copy of the current box
    this.bytes[G1_JP_CHECKSUM_OFFSET] = getGen1JapanChecksum(this.bytes)
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK1> {
    return PK1.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(nationalDex: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    if (extraFormIndex !== undefined) return false
    return nationalDex <= NationalDex.Mew && formeNumber === 0
  }

  supportsItem(itemIndex: number) {
    return ItemGen1.fromModern(itemIndex) !== undefined
  }
  static saveTypeAbbreviation = 'RBY (JP)'
  static saveTypeName = 'Pokémon Red/Green/Blue/Yellow (JP)'
  static saveTypeID = 'G1SAVJP'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length !== SAVE_SIZE_BYTES) {
      return false
    }
    // Japanese Gen 2 saves are also 0x8000 bytes with no distinguishing size
    if (areGen2JapanCrystalChecksumsValid(bytes) || areGen2JapanGoldSilverChecksumsValid(bytes)) {
      return false
    }
    return looksLikeGen1JapanSave(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return origin >= OriginGame.Red && origin <= OriginGame.Yellow
  }

  get trainerGender() {
    return BinaryGender.Male
  }

  getMonAt(boxNum: number, boxSlot: number) {
    const box = this.boxes[boxNum]
    if (!box) return undefined
    return box.boxSlots[boxSlot]
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<PK1>): void {
    const box = this.boxes[boxNum]
    if (!box) return
    box.boxSlots[boxSlot] = mon
  }
}
