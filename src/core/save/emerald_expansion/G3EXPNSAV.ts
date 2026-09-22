import { PluginPKMInterface } from '@openhome-core/pkm/interfaces'
import { PluginIdentifier } from '@openhome-core/tauri/spectaCommands'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  runningInTest,
} from '@openhome-core/util'
import { BinaryGender, Gen3Strings, Language, OriginGame } from '@pkm-rs/pkg'
import { G3Sector } from '../G3SAV'
import { Box, BoxAndSlot, PluginSAV } from '../interfaces'
import { LookupType } from '../util'
import { PathData } from '../util/path'

class G3EXPNSaveBackup<T extends PluginPKMInterface> {
  origin = OriginGame.Emerald
  bytes: Uint8Array
  saveIndex: number = 0
  isFirstSave: boolean = false
  securityKey: number = 0
  signature: number
  money: number = -1
  name: string = ''
  tid: number = 0
  sid: number = 0
  trainerGender: BinaryGender
  sectors: G3Sector[]
  pcDataContiguous: Uint8Array
  currentPCBox: number
  boxes: Box<T>[]
  firstSectorIndex: number = 0

  constructor(bytes: Uint8Array, PkmClass: new (bytes: ArrayBuffer) => T, boxCount: number) {
    this.bytes = bytes
    this.saveIndex = bytesToUint32LittleEndian(bytes, 0xffc)
    this.securityKey = bytesToUint32LittleEndian(bytes, 0xf20)
    this.money = bytesToUint32LittleEndian(bytes, 0x290) ^ this.securityKey
    this.sectors = []
    for (let i = 0; i < 14; i++) {
      this.sectors.push(new G3Sector(bytes, i))
      this.firstSectorIndex = this.sectors[0].sectionID
    }
    this.sectors.sort((sector1, sector2) => sector1.sectionID - sector2.sectionID)
    this.signature = this.sectors[0].signature

    const nBytes: number = boxCount * 58 * 30
    const nMons: number = boxCount * 30
    const fullSectionsUsed: number = Math.floor(nBytes / 4080)
    const leftoverBytes: number = nBytes % 4080

    // Concatenate pc data from all sectors
    this.pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4)
    this.sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
      const startOffset = i * 4080
      const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4

      this.pcDataContiguous.set(sector.data.slice(0, length), startOffset)
    })

    this.currentPCBox = this.pcDataContiguous[0]
    if (this.currentPCBox >= boxCount) {
      this.currentPCBox = 0
    }
    this.boxes = new Array<Box<T>>(boxCount)

    for (let i = 0; i < 14; i++) {
      const boxNameStart = 0x8344 + i * 9
      const boxNameSlice = this.pcDataContiguous.slice(boxNameStart, boxNameStart + 10)
      const boxName = Gen3Strings.decode10Bytes(boxNameSlice, 'Int')
      this.boxes[i] = new Box(boxName, 30)
    }
    for (let i = 0; i < nMons; i++) {
      const box = this.boxes[Math.floor(i / 30)]
      const slot = i % 30
      try {
        const mon = new PkmClass(this.pcDataContiguous.slice(4 + i * 80, 4 + (i + 1) * 80).buffer) // TODO: see if pkm sizes need to be updated here (80)
        box.boxSlots[slot] = mon
      } catch (e) {
        if (!`${e}`.endsWith('index 0 not found.')) {
          console.error(e)
        }
        if (!runningInTest()) {
          console.error(
            `File has invalid Pokémon data at box ${Math.floor(i / 30)}/slot ${slot}: ${e}`
          )
        }
      }
    }

    this.tid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0a)
    this.sid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0c)
    const trainerNameSlice = this.sectors[0].data.slice(0, 7)
    this.name = Gen3Strings.decode7Bytes(trainerNameSlice, 'Int')
    this.trainerGender = this.sectors[0].data[0x08] ? BinaryGender.Female : BinaryGender.Male
  }
}

export abstract class G3EXPNSAV<T extends PluginPKMInterface> extends PluginSAV<T> {
  static pkmType: any
  pkmTypeClass: any

  static lookupType: LookupType = 'gen345'

  primarySave: G3EXPNSaveBackup<T>
  backupSave: G3EXPNSaveBackup<T>
  primarySaveOffset: number

  origin = OriginGame.FireRed
  isPlugin: true = true
  abstract pluginIdentifier: PluginIdentifier

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number
  name: string
  tid: number
  sid: number
  displayID: string
  trainerGender: BinaryGender
  language = Language.None

  currentPCBox: number
  boxes: Array<Box<T>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false
  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array, pkmType: any) {
    super()
    this.pkmTypeClass = pkmType
    this.bytes = bytes
    this.filePath = path

    const saveOne = new G3EXPNSaveBackup<T>(bytes.slice(0, 0xe000), pkmType, this.getBoxCount())
    const saveTwo = new G3EXPNSaveBackup<T>(bytes.slice(0xe000, 0x1c000), pkmType, this.getBoxCount())

    if (saveOne.saveIndex > saveTwo.saveIndex) {
      this.primarySave = saveOne
      this.backupSave = saveTwo
      this.primarySaveOffset = 0
    } else {
      this.primarySave = saveTwo
      this.backupSave = saveOne
      this.primarySaveOffset = 0xe000
    }

    this.currentPCBox = this.primarySave.currentPCBox
    this.money = this.primarySave.money
    this.name = this.primarySave.name
    this.tid = this.primarySave.tid
    this.displayID = this.primarySave.tid.toString().padStart(5, '0')
    this.sid = this.primarySave.sid
    this.trainerGender = this.primarySave.trainerGender
    this.currentPCBox = this.primarySave.currentPCBox
    this.boxes = this.primarySave.boxes
  }

  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculateChecksum?: (() => number) | undefined

  prepareForSaving() {
    this.updatedBoxSlots.forEach(({ box, boxSlot: index }) => {
      const monOffset = 30 * box + index
      const pcBytes = new Uint8Array(80) // TODO: see if pkm sizes need to be updated here

      // Current Mon in loop
      const mon = this.boxes[box].boxSlots[index]

      // mon will be undefined if pokemon was moved from this slot
      //  and the slot was left empty
      const slotMon = this.boxes[box].boxSlots[index]

      if (mon && slotMon) {
        try {
          // If mon is a OHPKM then convert to Pokemon class
          const mon =
            slotMon instanceof this.pkmTypeClass ? slotMon : new this.pkmTypeClass(slotMon)

          if (mon?.gameOfOrigin && mon?.nationalDex) {
            mon.refreshChecksum()
            pcBytes.set(new Uint8Array(mon.toPCBytes()), 0)
          }
        } catch (e) {
          console.error(`G3EXPNSAV: ${e}`)
        }
      }
      this.primarySave.pcDataContiguous.set(pcBytes, 4 + monOffset * 80) // TODO: see if pkm sizes need to be updated here
    })

    // Slice pcData into Section Datas.
    // The first 14 boxes of data are stored in the first 6 section of PC data.
    // I am unsure where the rest of the data is stashed (ie: boxes 15-25)
    // So its just easier to only look at the first 6 sections of PC Data.
    // Each section of PC data is 4080 bytes.
    this.primarySave.sectors.slice(5, 11).forEach((sector, i) => {
      const pcData = this.primarySave.pcDataContiguous.slice(
        // 4080 times sector offset
        i * 0xff0,
        // 4080 ahead of that, or 0x450 ahead of that if box 13 zero indexed
        i * 0xff0 + (i + 5 === 13 ? 3964 : 0xff0)
      )

      sector.data.set(pcData)

      sector.writeToBuffer(this.primarySave.bytes, i + 5, this.primarySave.firstSectorIndex)
    })
    this.bytes.set(this.primarySave.bytes, this.primarySaveOffset)
  }

  abstract supportsMon(nationalDex: number, formeNumber: number): boolean

  abstract getBoxCount(): number
}
