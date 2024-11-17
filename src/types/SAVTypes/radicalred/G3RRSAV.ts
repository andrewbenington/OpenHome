import { GameOfOrigin } from 'pokemon-resources'
import { RR_TRANSFER_RESTRICTIONS } from '../../../consts/TransferRestrictions'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../../util/ByteLogic'
import { gen3StringToUTF } from '../../../util/Strings/StringConverter'
import { isRestricted } from '../../TransferRestrictions'
import { OHPKM } from '../../pkm/OHPKM'
import { Box, BoxCoordinates, PluginSAV } from '../SAV'
import { PathData, splitPath } from '../path'
import PK3RR from './PK3RR'

const SAVE_SIZE_BYTES = 0x20000

export class G3RRSector {
  data: Uint8Array
  sectionID: number
  checksum: number
  signature: number
  saveIndex: number

  constructor(bytes: Uint8Array, index: number) {
    this.data = bytes.slice(index * 0x1000, index * 0x1000 + 4080)
    this.sectionID = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff4)
    this.checksum = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff6)
    this.signature = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xff8)
    this.saveIndex = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xffc)
  }

  writeToBuffer(bytes: Uint8Array, thisIndex: number, firstIndex: number) {
    const oldChecksum = this.checksum
    this.refreshChecksum()
    if (oldChecksum !== this.checksum) {
      console.info('checksum changed for', thisIndex)
    }
    const index = (thisIndex + 14 - firstIndex) % 14
    bytes.set(this.data, index * 0x1000)
    bytes.set(uint16ToBytesLittleEndian(this.sectionID), index * 0x1000 + 0xff4)
    bytes.set(uint16ToBytesLittleEndian(this.checksum), index * 0x1000 + 0xff6)
    bytes.set(uint32ToBytesLittleEndian(this.signature), index * 0x1000 + 0xff8)
    bytes.set(uint32ToBytesLittleEndian(this.saveIndex), index * 0x1000 + 0xffc)
  }

  refreshChecksum() {
    let checksum = 0
    let byteLength = 0xff0
    if (this.sectionID === 0) {
      byteLength = 3884
    } else if (this.sectionID === 13) {
      byteLength = 2000
    }
    for (let i = 0; i < byteLength; i += 4) {
      checksum += bytesToUint32LittleEndian(this.data, i)
      checksum = checksum & 0xffffffff
    }
    this.checksum = ((checksum & 0xffff) + ((checksum >> 16) & 0xffff)) & 0xffff
  }
}
export class G3RRSaveBackup {
  origin: GameOfOrigin = GameOfOrigin.INVALID_0
  bytes: Uint8Array
  saveIndex: number = 0
  isFirstSave: boolean = false
  securityKey: number = 0
  money: number = -1
  name: string = ''
  tid: number = 0
  sid: number = 0
  sectors: G3RRSector[]
  pcDataContiguous: Uint8Array
  currentPCBox: number
  boxes = new Array<Box<PK3RR>>(14)
  boxNames: string[]
  firstSectorIndex: number = 0

  constructor(bytes: Uint8Array) {
    this.bytes = bytes
    this.saveIndex = bytesToUint32LittleEndian(bytes, 0xffc)
    this.securityKey = bytesToUint32LittleEndian(bytes, 0xf20)
    this.money = bytesToUint32LittleEndian(bytes, 0x290) ^ this.securityKey
    this.sectors = []
    for (let i = 0; i < 14; i++) {
      this.sectors.push(new G3RRSector(bytes, i))
      this.firstSectorIndex = this.sectors[0].sectionID
    }
    this.sectors.sort((sector1, sector2) => sector1.sectionID - sector2.sectionID)
    this.name = gen3StringToUTF(this.sectors[0].data, 0, 10)

    const boxes: number = 18;
    const nBytes: number = boxes * 58 * 30
    const nMons: number = boxes * 30
    const fullSectionsUsed: number = Math.floor(nBytes / 4080)
    const leftoverBytes: number = nBytes % 4080

    // Concatenate pc data from all sectors
    this.pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4) // 144 // 24,504
    this.sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
      const startOffset = i * 4080
      const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4
      this.pcDataContiguous.set(sector.data.slice(0, length), startOffset)
    })

    this.currentPCBox = this.pcDataContiguous[0]
    this.boxNames = []
    for (let i = 0; i < boxes; i++) {
      // TODO: More research into where BOX names are located
      this.boxes[i] = new Box('Box' + (i + 1), 30)
    }
    for (let i = 0; i < nMons; i++) {
      try {
        const mon = new PK3RR(this.pcDataContiguous.slice(4 + i * 58, 4 + (i + 1) * 58).buffer)
        if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
          const box = this.boxes[Math.floor(i / 30)]
          box.pokemon[i % 30] = mon
        }
        if (mon.trainerID == this.tid) {
          mon.gameOfOrigin = GameOfOrigin.FireRed
        }
      } catch (e) {
        console.error(e)
      }
    }

    this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, 0xaf8)
    this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x290) ^ this.securityKey

    this.name = gen3StringToUTF(this.sectors[0].data, 0x00, 7)
    this.tid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0a)
    this.sid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0c)
  }
}

export class G3RRSAV implements PluginSAV<PK3RR> {
  static pkmType = PK3RR

  static transferRestrictions = RR_TRANSFER_RESTRICTIONS

  static TRAINER_OFFSET = 0x0ff4 * 0
  static TEAM_ITEMS_OFFSET = 0x0ff4 * 1
  static PC_OFFSET = 0x0ff4 * 5

  primarySave: G3RRSaveBackup
  backupSave: G3RRSaveBackup
  primarySaveOffset: number

  origin: GameOfOrigin = 0
  isPlugin: true = true
  pluginIdentifier = 'radical_red'

  boxRows = 5
  boxColumns = 6

  filePath: PathData
  fileCreated?: Date

  money: number
  name: string
  tid: number
  sid: number
  displayID: string

  currentPCBox: number
  boxes: Array<Box<PK3RR>>
  boxNames: string[]

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false
  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path

    const saveOne = new G3RRSaveBackup(bytes.slice(0, 0xe000))
    const saveTwo = new G3RRSaveBackup(bytes.slice(0xe000, 0x1c000))

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
    this.currentPCBox = this.primarySave.currentPCBox
    this.boxes = this.primarySave.boxes
    this.boxNames = this.primarySave.boxNames

    // Hacky way to detect save version
    this.boxes.forEach((box) => {
      box.pokemon.forEach((mon) => {
        if (
          mon &&
          mon.trainerID === this.tid &&
          mon.secretID === this.sid &&
          mon.trainerName === this.name
        ) {
          this.origin = mon.gameOfOrigin
        }
      })
    })
    const filePathElements = splitPath(this.filePath)
    let fileName = filePathElements[filePathElements.length - 1]
    fileName = fileName.replace(/\s+/g, '')
    this.origin = GameOfOrigin.FireRed

    console.log(this.boxes)
  }
  
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculateChecksum?: (() => number) | undefined

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const monOffset = 30 * box + index
      const pcBytes = new Uint8Array(58) // Per pokemon bytes

      // Current Mon in loop
      const changedMon = this.boxes[box].pokemon[index]

      // We don't want to save OHPKM files of mons that didn't leave the save
      //  (and would still be PK3s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon)
      }
      // changedMon will be undefined if pokemon was moved from this slot
      //  and the slot was left empty
      const slotMon = this.boxes[box].pokemon[index]
      if (changedMon && slotMon) {
        try {
          // If mon is a OHPKM then convert to PK3RR
          const mon = slotMon instanceof PK3RR ? slotMon : new PK3RR(slotMon)

          if (mon?.gameOfOrigin && mon?.dexNum) pcBytes.set(new Uint8Array(mon.toPCBytes()), 0)
        } catch (e) {
          console.error(e)
        }
      }
      this.primarySave.pcDataContiguous.set(pcBytes, 4 + monOffset * 58)
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
    return changedMonPKMs
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return !isRestricted(RR_TRANSFER_RESTRICTIONS, dexNumber, formeNumber)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    return 'Pokémon Radical Red'
  }

  gameColor() {
    return '#F15C01'
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin === GameOfOrigin.FireRed
  }

  static saveTypeAbbreviation = 'Radical Red'
  static saveTypeName = 'Pokémon Radical Red'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length !== SAVE_SIZE_BYTES) {
      return false
    }

    return (
      bytesToUint32LittleEndian(bytes, 0xac) === 0 &&
      bytesToUint32LittleEndian(bytes, findFirstSaveIndexZero(bytes) + 0xac) > 0
    )
  }

  getPluginIdentifier() {
    return 'radical_red'
  }
}

const findFirstSaveIndexZero = (bytes: Uint8Array): number => {
  const SECTION_SIZE = 0x1000 // Each section is 4 KB
  const SAVE_INDEX_OFFSET = 0xff4 // Save index location within each section

  for (let i = 0; i < 14; i++) {
    const sectionStart = i * SECTION_SIZE
    const saveIndex = bytesToUint16LittleEndian(bytes, sectionStart + SAVE_INDEX_OFFSET)

    if (saveIndex === 0) {
      return sectionStart
    }
  }
  return 0
}
