import { PK2 } from '@openhome-core/pkm'
import { EXCLAMATION } from '@openhome-core/resources/consts/Forms'
import { NationalDex } from '@openhome-core/resources/consts/NationalDex'
import { GEN2_TRANSFER_RESTRICTIONS } from '@openhome-core/resources/consts/TransferRestrictions'
import { Errorable, Option, unique } from '@openhome-core/util/functional'
import {
  readGameBoyStringFromBytes,
  utf16StringToGen12,
} from '@openhome-core/util/stringConversion'
import {
  BinaryGender,
  ConvertStrategy,
  ExtraFormIndex,
  ItemGen2,
  Language,
  OriginGame,
} from '@pkm-rs/pkg'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxAndSlot, OfficialSAV } from './interfaces'
import { LookupType } from './util'
import {
  areGen2JapanCrystalChecksumsValid,
  areGen2JapanGoldSilverChecksumsValid,
  G2_JP_BACKUP_OFFSET,
  G2_JP_CHECKSUM_END_CRYSTAL,
  G2_JP_CHECKSUM_END_GS,
  G2_JP_CHECKSUM_OFFSET,
  G2_JP_CHECKSUM_OFFSET_2,
  G2_JP_CHECKSUM_START,
  getGen2JapanChecksum,
} from './util/gbJapanChecksums'
import { PathData } from './util/path'

/**
 * Japanese Gen 2 saves use 9 boxes of 30 (vs international 14 of 20),
 * 5-character names (+ terminator), the Japanese character encoding, and a
 * 16-bit checksum stored at 0x2D0D/0x7F0D. On save the game mirrors the
 * trainer data region to 0x7209. The banked copy of the active box is stale;
 * the live copy sits at 0x2D10 in main data.
 */

const MIN_SAVE_SIZE_BYTES = 0x8000
const NAME_SIZE = 6 // 5 characters + terminator
const BOX_CAPACITY = 30
const BOX_MON_SIZE = 0x20
const BOX_PKM_OFFSET = 1 + BOX_CAPACITY + 1
const BOX_OT_OFFSET = BOX_PKM_OFFSET + BOX_CAPACITY * BOX_MON_SIZE
const BOX_NICKNAME_OFFSET = BOX_OT_OFFSET + BOX_CAPACITY * NAME_SIZE
// each stored box is followed by 2 padding bytes
const BOX_SIZE = BOX_NICKNAME_OFFSET + BOX_CAPACITY * NAME_SIZE + 2 // 0x54A

const TID_OFFSET = 0x2009
const TRAINER_NAME_OFFSET = 0x200b
const CURRENT_BOX_INDEX_OFFSET_GS = 0x2705
const CURRENT_BOX_INDEX_OFFSET_CRYSTAL = 0x26e2
const CURRENT_BOX_DATA_OFFSET = 0x2d10

const BOX_OFFSETS = [
  ...[0, 1, 2, 3, 4, 5].map((i) => 0x4000 + i * BOX_SIZE),
  ...[0, 1, 2].map((i) => 0x6000 + i * BOX_SIZE),
]

export class G2SAVJP extends OfficialSAV<PK2> {
  static pkmType = PK2

  static transferRestrictions = GEN2_TRANSFER_RESTRICTIONS
  static lookupType: LookupType = 'gen12'

  origin: OriginGame = OriginGame.Gold
  isPlugin: false = false

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number = 0
  name: string
  tid: number
  sid?: number | undefined
  displayID: string
  language = Language.Japanese

  currentPCBox: number
  boxes: Array<Box<PK2>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super()
    this.bytes = bytes
    const dataView = new DataView(this.bytes.buffer)

    this.filePath = path
    this.tid = dataView.getUint16(TID_OFFSET)
    this.displayID = this.tid.toString().padStart(5, '0')
    this.name = readGameBoyStringFromBytes(dataView, TRAINER_NAME_OFFSET, NAME_SIZE, 'Jpn')

    if (areGen2JapanCrystalChecksumsValid(this.bytes)) {
      this.origin = OriginGame.Crystal
    } else if (this.filePath.name.toUpperCase().includes('SILVER')) {
      this.origin = OriginGame.Silver
    } else {
      this.origin = OriginGame.Gold
    }

    this.currentPCBox =
      this.bytes[
        this.origin === OriginGame.Crystal
          ? CURRENT_BOX_INDEX_OFFSET_CRYSTAL
          : CURRENT_BOX_INDEX_OFFSET_GS
      ] & 0x7f

    if (this.currentPCBox >= BOX_OFFSETS.length) {
      this.invalid = true
      this.boxes = []
      return
    }
    // the banked copy of the active box is stale; the live copy is in main data
    this.bytes.set(
      this.bytes.slice(CURRENT_BOX_DATA_OFFSET, CURRENT_BOX_DATA_OFFSET + BOX_SIZE - 2),
      BOX_OFFSETS[this.currentPCBox]
    )

    this.boxes = new Array<Box<PK2>>(BOX_OFFSETS.length)

    BOX_OFFSETS.forEach((offset, boxNumber) => {
      const monCount = Math.min(bytes[offset], BOX_CAPACITY)

      this.boxes[boxNumber] = new Box(`Box ${boxNumber + 1}`, BOX_CAPACITY)
      for (let monIndex = 0; monIndex < monCount; monIndex++) {
        const mon = PK2.fromBytes(
          this.bytes.slice(
            offset + BOX_PKM_OFFSET + monIndex * BOX_MON_SIZE,
            offset + BOX_PKM_OFFSET + (monIndex + 1) * BOX_MON_SIZE
          ).buffer
        )

        mon.trainerName = readGameBoyStringFromBytes(
          dataView,
          offset + BOX_OT_OFFSET + monIndex * NAME_SIZE,
          NAME_SIZE,
          'Jpn'
        )
        mon.nickname = readGameBoyStringFromBytes(
          dataView,
          offset + BOX_NICKNAME_OFFSET + monIndex * NAME_SIZE,
          NAME_SIZE,
          'Jpn'
        )
        mon.gameOfOrigin = mon.metLevel ? OriginGame.Crystal : this.origin
        mon.language = Language.Japanese
        this.boxes[boxNumber].boxSlots[monIndex] = mon
      }
    })
  }

  prepareForSaving() {
    const changedBoxes = unique(this.updatedBoxSlots.map((coords) => coords.box))

    changedBoxes.forEach((boxNumber) => {
      const boxByteOffset = BOX_OFFSETS[boxNumber]
      const box = this.boxes[boxNumber]
      let numMons = 0

      box.boxSlots.forEach((boxMon) => {
        if (boxMon) {
          this.bytes[boxByteOffset + 1 + numMons] = boxMon.nationalDex
          this.bytes.set(
            new Uint8Array(boxMon.toBytes().slice(0, BOX_MON_SIZE)),
            boxByteOffset + BOX_PKM_OFFSET + numMons * BOX_MON_SIZE
          )
          const trainerNameBuffer = utf16StringToGen12(boxMon.trainerName, NAME_SIZE, true, 'Jpn')

          this.bytes.set(trainerNameBuffer, boxByteOffset + BOX_OT_OFFSET + numMons * NAME_SIZE)
          const nicknameBuffer = utf16StringToGen12(boxMon.nickname, NAME_SIZE, true, 'Jpn')

          this.bytes.set(nicknameBuffer, boxByteOffset + BOX_NICKNAME_OFFSET + numMons * NAME_SIZE)
          numMons++
        }
      })
      this.bytes[boxByteOffset] = numMons
      const remainingSlots = BOX_CAPACITY - numMons

      if (remainingSlots) {
        this.bytes.set(new Uint8Array(remainingSlots + 1), boxByteOffset + 1 + numMons)
        this.bytes.set(
          new Uint8Array(BOX_MON_SIZE * remainingSlots),
          boxByteOffset + BOX_PKM_OFFSET + numMons * BOX_MON_SIZE
        )
        this.bytes.set(
          new Uint8Array(NAME_SIZE * remainingSlots),
          boxByteOffset + BOX_OT_OFFSET + numMons * NAME_SIZE
        )
        this.bytes.set(
          new Uint8Array(NAME_SIZE * remainingSlots),
          boxByteOffset + BOX_NICKNAME_OFFSET + numMons * NAME_SIZE
        )
      }
      this.bytes[boxByteOffset + 1 + numMons] = 0xff

      if (boxNumber === this.currentPCBox) {
        this.bytes.set(
          this.bytes.slice(boxByteOffset, boxByteOffset + BOX_SIZE - 2),
          CURRENT_BOX_DATA_OFFSET
        )
      }
    })

    const checksumEnd =
      this.origin === OriginGame.Crystal ? G2_JP_CHECKSUM_END_CRYSTAL : G2_JP_CHECKSUM_END_GS
    const checksum = getGen2JapanChecksum(this.bytes, checksumEnd)
    const backupLength = checksumEnd - G2_JP_CHECKSUM_START + 1

    this.bytes[G2_JP_CHECKSUM_OFFSET] = checksum & 0xff
    this.bytes[G2_JP_CHECKSUM_OFFSET + 1] = checksum >> 8
    // the game keeps a full backup of the trainer data region and the checksum
    this.bytes.set(
      this.bytes.slice(G2_JP_CHECKSUM_START, G2_JP_CHECKSUM_START + backupLength),
      G2_JP_BACKUP_OFFSET
    )
    this.bytes[G2_JP_CHECKSUM_OFFSET_2] = checksum & 0xff
    this.bytes[G2_JP_CHECKSUM_OFFSET_2 + 1] = checksum >> 8
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK2> {
    return PK2.fromOhpkm(ohpkm, strategy)
  }

  supportsMon(nationalDex: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    if (extraFormIndex !== undefined) return false
    return (
      (nationalDex <= NationalDex.Celebi && formeNumber === 0) ||
      (nationalDex === NationalDex.Unown && formeNumber < EXCLAMATION)
    )
  }

  supportsItem(itemIndex: number) {
    return ItemGen2.fromModern(itemIndex) !== undefined
  }

  static saveTypeAbbreviation = 'GSC (JP)'
  static saveTypeName = 'Pokémon Gold/Silver/Crystal (JP)'
  static saveTypeID = 'G2SAVJP'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < MIN_SAVE_SIZE_BYTES) {
      return false
    }
    return areGen2JapanCrystalChecksumsValid(bytes) || areGen2JapanGoldSilverChecksumsValid(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return origin >= OriginGame.Gold && origin <= OriginGame.Crystal
  }

  get trainerGender() {
    // the Japanese Crystal gender flag lives outside the first SRAM bank;
    // default to Male rather than misread another field
    return BinaryGender.Male
  }

  getMonAt(boxNum: number, boxSlot: number) {
    const box = this.boxes[boxNum]
    if (!box) return undefined
    return box.boxSlots[boxSlot]
  }

  setMonAt(boxNum: number, boxSlot: number, mon: Option<PK2>): void {
    const box = this.boxes[boxNum]
    if (!box) return
    box.boxSlots[boxSlot] = mon
  }
}
