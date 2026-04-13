import {
  ConvertStrategy,
  ExtraFormIndex,
  Gender,
  Language,
  luminescentSupportsExtraForm,
  OriginGame,
} from '@pkm-rs/pkg'
import { utf16BytesToString } from '@pokemon-files/util'

import { OHPKM } from '../../pkm/OHPKM'
import { md5Digest } from '../encryption/Encryption'
import { Box, BoxAndSlot, PluginSAV, SlotMetadata } from '../interfaces'
import {
  isRestricted,
  TransferLockedForms,
  TransferRestrictions,
} from '../util/TransferRestrictions'
import { PathData } from '../util/path'
import PB8LUMI from './PB8LUMI'

// PC layout constants
const BOX_COUNT = 40
const BOX_NAME_LENGTH = 0x22
const BOX_MONS_OFFSET = 0x14ef4

export const LUMI_1_1_VERSION_IDENTIFIER = 0x0000
export const LUMI_1_3_VERSION_IDENTIFIER = 0x0103
export const LUMI_1_3RV1_VERSION_IDENTIFIER = 0x0134

export type LUMI_SAVE_REVISION = '1.1' | '1.3' | '1.3rv1'

// Transfer rules used by OpenHome when importing/exporting Pokémon
export const LP_TRANSFER_RESTRICTIONS: TransferRestrictions = {
  /* While only a few post-Gen 4 Pokémon have models in Luminescent Platinum (falling back to Ditto models),
  they can still be generated and transferred. Their data structure, including stats, is fully supported.
  We allow up to 1025 so users who add  Pokémon via tools like PKLumiHex can move them back and forth freely. */
  maxDexNum: 1025,
  excludedForms: {
    ...TransferLockedForms,
  },
}

export class G8LumiSAV extends PluginSAV<PB8LUMI> {
  // Static metadata
  static saveTypeAbbreviation = 'LUMI'
  static saveTypeName = 'Pokémon Luminescent Platinum'
  static saveTypeID = 'luminescent_platinum'
  static pkmType = PB8LUMI
  static boxSizeBytes = PB8LUMI.getBoxSize() * 30

  isPlugin = true as const
  pluginIdentifier = 'luminescent_platinum' as const
  origin: OriginGame

  // Raw save file state
  filePath: PathData
  fileCreated?: Date
  bytes: Uint8Array
  hashOffset: number
  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  // Trainer metadata
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''
  money: number = 0

  // PC storage layout
  boxRows = 5
  boxColumns = 6
  currentPCBox: number = 0
  boxes: Box<PB8LUMI>[] = []
  updatedBoxSlots: BoxAndSlot[] = []

  private _trainerGender?: Gender
  myStatusBlock: MyStatusBlock
  configBlock: ConfigBlock

  constructor(path: PathData, bytes: Uint8Array) {
    super()
    this.bytes = bytes
    this.filePath = path
    this.hashOffset = this.bytes.length - 16

    // Parse trainer information
    this.myStatusBlock = new MyStatusBlock(bytes)
    this.configBlock = new ConfigBlock(bytes)
    this.name = this.myStatusBlock.getName()

    const fullTrainerID = this.myStatusBlock.getFullID()
    this.tid = fullTrainerID % 1000000
    this.sid = this.myStatusBlock.getSID()
    this.displayID = this.tid.toString().padStart(6, '0')
    this.origin = this.myStatusBlock.getGame()

    // Initialize PC boxes and names
    const boxNamesBlock = new BoxLayoutLumi(this.bytes)
    this.boxes = Array(this.getBoxCount())

    for (let box = 0; box < this.getBoxCount(); box++) {
      const boxName = boxNamesBlock.getBoxName(box) || `Box ${box + 1}`
      this.boxes[box] = new Box(boxName, 30)
    }

    // Parse Pokémon stored in the PC
    for (let box = 0; box < this.getBoxCount(); box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte =
            BOX_MONS_OFFSET + this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * monIndex
          const endByte = startByte + this.getMonBoxSizeBytes()
          const monData = (bytes.buffer as ArrayBuffer).slice(startByte, endByte)
          const mon = this.buildPKM(monData, true)

          // Only populate slots containing valid Pokémon
          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].boxSlots[monIndex] = mon
          }
        } catch (e) {
          console.error(`Failed to parse Pokémon in Box ${box + 1}, Slot ${monIndex + 1}:`, e)
        }
      }
    }
  }

  // Identifier used by the Recent Saves dashboard
  static getPluginIdentifier() {
    return G8LumiSAV.saveTypeID
  }

  // Determines which in-game origin marks belong to this save type
  static includesOrigin(origin: OriginGame): boolean {
    return origin === OriginGame.BrilliantDiamond || origin === OriginGame.ShiningPearl
  }

  // Determines whether a file matches Luminescent Platinum save structure
  static fileIsSave(bytes: Uint8Array): boolean {
    const isLumiSize = bytes.length >= 900000 && bytes.length <= 1200000
    if (!isLumiSize) return false

    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const versionIdentifier = dataView.getUint16(0, true)

    return (
      versionIdentifier === LUMI_1_1_VERSION_IDENTIFIER ||
      versionIdentifier === LUMI_1_3_VERSION_IDENTIFIER ||
      versionIdentifier === LUMI_1_3RV1_VERSION_IDENTIFIER
    )
  }

  get trainerGender(): Gender {
    if (this._trainerGender !== undefined) return this._trainerGender
    if (this.myStatusBlock) {
      try {
        return this.myStatusBlock.getGender() ? Gender.Female : Gender.Male
      } catch {
        return Gender.Male
      }
    }
    return Gender.Male
  }

  set trainerGender(value: Gender) {
    this._trainerGender = value
  }

  getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined

  getBoxCount = () => BOX_COUNT
  getMonBoxSizeBytes = () => PB8LUMI.getBoxSize()
  getBoxSizeBytes = () => G8LumiSAV.boxSizeBytes
  getCurrentBox = () => this.boxes[this.currentPCBox]
  getPluginIdentifier = () => G8LumiSAV.saveTypeID

  // Determines which Luminescent Platinum save revision the file matches
  getSaveRevision(): LUMI_SAVE_REVISION {
    const dataView = new DataView(this.bytes.buffer)
    const versionIdentifier = dataView.getUint16(0, true)

    switch (versionIdentifier) {
      case LUMI_1_1_VERSION_IDENTIFIER:
        return '1.1'
      case LUMI_1_3_VERSION_IDENTIFIER:
        return '1.3'
      case LUMI_1_3RV1_VERSION_IDENTIFIER:
        return '1.3rv1'
      default:
        throw new Error(
          `Luminescent Platinum save has invalid version identifier: ${versionIdentifier}`
        )
    }
  }

  // Metadata displayed in the UI
  getDisplayData() {
    return {
      'Player Character': this.myStatusBlock.getGender() ? 'Dawn' : 'Lucas',
      'Lumi Save Version': this.getSaveRevision(),
      'Calculated Checksum': this.calculateChecksumStr(),
    }
  }

  // Builds a Luminescent Platinum Pokémon instance from raw bytes
  buildPKM(bytes: ArrayBuffer, encrypted: boolean): PB8LUMI {
    return PB8LUMI.fromBytes(bytes, encrypted)
  }

  // Converts an OpenHome Pokémon into the Luminescent format
  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): PB8LUMI {
    return PB8LUMI.fromOhpkm(ohpkm, strategy)
  }

  // Writes modified Pokémon back into the save buffer
  prepareForSaving() {
    this.updatedBoxSlots.forEach(({ box, boxSlot: monIndex }) => {
      const mon = this.boxes[box].boxSlots[monIndex]
      const writeIndex =
        BOX_MONS_OFFSET + this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * monIndex

      if (mon) {
        try {
          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum()
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex)
          }
        } catch (e) {
          console.error(`Failed to write Pokémon in Box ${box + 1}, Slot ${monIndex + 1}:`, e)
          throw new Error(
            `Data corruption risk: Failed to save Pokémon at Box ${box + 1}, Slot ${monIndex + 1}. Save aborted.`
          )
        }
      } else {
        const emptyMon = PB8LUMI.fromBytes(new Uint8Array(PB8LUMI.getBoxSize()).buffer)
        this.bytes.set(new Uint8Array(emptyMon.toPCBytes()), writeIndex)
      }
    })

    this.bytes.set(this.calculateChecksumBytes(), this.hashOffset)
  }

  // Calculates the MD5 checksum used by the save file
  calculateChecksumBytes() {
    const bytesCopy = copyByteArray(this.bytes)
    bytesCopy.fill(0, this.hashOffset, this.hashOffset + 16)
    return md5Digest(bytesCopy)
  }

  calculateChecksumStr() {
    return uint8ArrayToBase64(this.calculateChecksumBytes())
  }

  supportsMon(dexNumber: number, formeNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    if (extraFormIndex !== undefined) return luminescentSupportsExtraForm(extraFormIndex)
    return !isRestricted(LP_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  supportsItem(itemIndex: number) {
    return itemIndex <= 1836
  }

  get language() {
    return this.configBlock.getLanguage()
  }
}

// Reads PC box names and layout information from the save file
class BoxLayoutLumi {
  dataView: DataView<ArrayBuffer>

  constructor(saveBytes: Uint8Array) {
    this.dataView = new DataView(saveBytes.slice(0x148aa, 0x148aa + 0x64a).buffer)
  }

  public getBoxName(index: number): string {
    if (index >= BOX_COUNT) {
      throw Error('Attempting to get box name at index past BOX_COUNT')
    }
    return utf16BytesToString(this.dataView.buffer, index * BOX_NAME_LENGTH, BOX_NAME_LENGTH)
  }

  public getCurrentBox(): number {
    return this.dataView.getUint8(0x61e)
  }
}

// Parses trainer metadata stored in the save
class MyStatusBlock {
  dataView: DataView<ArrayBuffer>

  constructor(saveBytes: Uint8Array) {
    this.dataView = new DataView(saveBytes.slice(0x79bb4, 0x79bb4 + 0x50).buffer)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0, 24)
  }

  public getFullID(): number {
    return this.dataView.getUint32(0x1c, true)
  }

  public getSID(): number {
    return this.dataView.getUint16(0x1e, true)
  }

  public getGender(): boolean {
    return !(this.dataView.getUint8(0x24) & 1)
  }

  public getGame(): OriginGame {
    const origin = this.dataView.getUint8(0x2b)
    return origin === 0 ? OriginGame.BrilliantDiamond : OriginGame.ShiningPearl
  }
}

class ConfigBlock {
  dataView: DataView<ArrayBuffer>

  constructor(saveBytes: Uint8Array) {
    this.dataView = new DataView(saveBytes.slice(0x79b74, 0x79b74 + 0x40).buffer)
  }

  public getLanguage(): Language {
    return this.dataView.getUint32(0x04, true)
  }
}

// Converts a Uint8Array to base64 for checksum display
function uint8ArrayToBase64(uint8Array: Uint8Array) {
  return btoa(String.fromCharCode(...uint8Array))
}

// Creates a copy of a byte array for checksum calculations
function copyByteArray(bytes: Uint8Array): Uint8Array {
  const bufferCopy = new ArrayBuffer(bytes.length)
  const arrayCopy = new Uint8Array(bufferCopy)

  arrayCopy.set(new Uint8Array(bytes))
  return arrayCopy
}
