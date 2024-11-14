import { PK3 } from 'pokemon-files'
import { GameOfOrigin, GameOfOriginData } from 'pokemon-resources'
import { NationalDex } from 'pokemon-species-data'
import { GEN3_TRANSFER_RESTRICTIONS } from '../../consts/TransferRestrictions'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  bytesToUint64LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { gen3StringToUTF } from '../../util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxCoordinates, SAV } from './SAV'
import { ParsedPath, splitPath } from './path'
import { LOOKUP_TYPE } from './util'

const SAVE_SIZE_BYTES = 0x20000

export class G3Sector {
  data: Uint8Array

  sectionID: number

  checksum: number

  signature: number

  saveIndex: number

  constructor(bytes: Uint8Array, index: number) {
    this.data = bytes.slice(index * 0x1000, index * 0x1000 + 3968)
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
    let byteLength = 3968
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
export class G3SaveBackup {
  origin: GameOfOrigin = GameOfOrigin.INVALID_0

  bytes: Uint8Array

  saveIndex: number = 0

  isFirstSave: boolean = false

  securityKey: number = 0

  money: number = -1

  name: string = ''

  tid: number = 0

  sid: number = 0

  sectors: G3Sector[]

  pcDataContiguous: Uint8Array

  currentPCBox: number

  boxes = new Array<Box<PK3>>(14)

  firstSectorIndex: number = 0

  constructor(bytes: Uint8Array) {
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
    this.name = gen3StringToUTF(this.sectors[0].data, 0, 10)
    // concatenate pc data from all sectors
    this.pcDataContiguous = new Uint8Array(33744)
    this.sectors.slice(5).forEach((sector, i) => {
      if (i + 5 === 13) {
        this.pcDataContiguous.set(sector.data.slice(0, 2000), i * 3968)
      } else {
        this.pcDataContiguous.set(sector.data, i * 3968)
      }
    })
    this.currentPCBox = this.pcDataContiguous[0]

    for (let i = 0; i < 14; i++) {
      this.boxes[i] = new Box(gen3StringToUTF(this.pcDataContiguous, 0x8344 + i * 9, 10), 30)
    }
    for (let i = 0; i < 420; i++) {
      try {
        const mon = new PK3(this.pcDataContiguous.slice(4 + i * 80, 4 + (i + 1) * 80).buffer, true)
        if (mon.isValid()) {
          const box = this.boxes[Math.floor(i / 30)]
          box.pokemon[i % 30] = mon
        }
      } catch (e) {
        console.error(e)
      }
    }
    switch (bytesToUint32LittleEndian(this.sectors[0].data, 0xac)) {
      case 0:
        this.origin = GameOfOrigin.Ruby
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x490)
        break
      case 1:
        this.origin = GameOfOrigin.FireRed
        this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, 0xaf8)
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x290) ^ this.securityKey
        break
      default:
        this.origin = GameOfOrigin.Emerald
        this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, 0xac)
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x490) ^ this.securityKey
        break
    }
    this.name = gen3StringToUTF(this.sectors[0].data, 0x00, 7)
    this.tid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0a)
    this.sid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0c)
  }
}

export class G3SAV implements SAV<PK3> {
  static pkmType = PK3

  static transferRestrictions = GEN3_TRANSFER_RESTRICTIONS
  static lookupType: LOOKUP_TYPE = 'gen345'

  static TRAINER_OFFSET = 0x0ff4 * 0

  static TEAM_ITEMS_OFFSET = 0x0ff4 * 1

  static PC_OFFSET = 0x0ff4 * 5

  primarySave: G3SaveBackup

  backupSave: G3SaveBackup

  primarySaveOffset: number

  origin: GameOfOrigin
  isPlugin: false = false

  boxRows = 5
  boxColumns = 6

  filePath: ParsedPath
  fileCreated?: Date

  money: number
  name: string
  tid: number
  sid: number
  displayID: string

  currentPCBox: number
  boxes: Array<Box<PK3>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: ParsedPath, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path
    const saveOne = new G3SaveBackup(bytes.slice(0, 0xe000))
    const saveTwo = new G3SaveBackup(bytes.slice(0xe000, 0x1c000))
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

    // hacky way to detect save version
    // TODO: make more robust
    const trainerMon = this.boxes
      .flatMap((box) => box.pokemon)
      .find(
        (mon) =>
          mon &&
          mon.trainerID === this.tid &&
          mon.secretID === this.sid &&
          mon.trainerName === this.name
      )

    if (trainerMon) {
      this.origin = trainerMon?.gameOfOrigin
    } else {
      const filePathElements = splitPath(this.filePath)
      let fileName = filePathElements[filePathElements.length - 1]
      fileName = fileName.replace(/\s+/g, '')
      if (fileName.includes('Ruby')) {
        this.origin = GameOfOrigin.Ruby
        return
      }
      if (fileName.includes('Sapphire')) {
        this.origin = GameOfOrigin.Sapphire
        return
      }
      if (fileName.includes('FireRed')) {
        this.origin = GameOfOrigin.FireRed
        return
      }
      if (fileName.includes('LeafGreen')) {
        this.origin = GameOfOrigin.LeafGreen
      } else {
        this.origin = this.primarySave.origin
      }
    }
    console.log(this.boxes)
  }
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  pluginIdentifier?: string | undefined
  calculateChecksum?: (() => number) | undefined

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const monOffset = 30 * box + index
      const pcBytes = new Uint8Array(80)
      const changedMon = this.boxes[box].pokemon[index]
      // we don't want to save OHPKM files of mons that didn't leave the save
      // (and would still be PK3s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon)
      }
      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      const slotMon = this.boxes[box].pokemon[index]
      if (changedMon && slotMon) {
        try {
          const mon = slotMon instanceof PK3 ? slotMon : new PK3(slotMon)
          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum()
            pcBytes.set(new Uint8Array(mon.toPCBytes()), 0)
          }
        } catch (e) {
          console.error(e)
        }
      }
      this.primarySave.pcDataContiguous.set(pcBytes, 4 + monOffset * 80)
    })
    this.primarySave.sectors.slice(5).forEach((sector, i) => {
      const pcData = this.primarySave.pcDataContiguous.slice(
        // 3968 times sector offset
        i * 3968,
        // 3968 ahead of that, or 2000 ahead of that if box 13 zero indexed
        i * 3968 + (i + 5 === 13 ? 2000 : 3968)
      )
      sector.data.set(pcData)
      sector.writeToBuffer(this.primarySave.bytes, i + 5, this.primarySave.firstSectorIndex)
    })
    this.bytes.set(this.primarySave.bytes, this.primarySaveOffset)
    return changedMonPKMs
  }

  supportsMon(dexNumber: number, formeNumber: number) {
    return dexNumber <= NationalDex.Deoxys && (formeNumber == 0 || dexNumber === NationalDex.Unown)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getGameName() {
    const gameOfOrigin = GameOfOriginData[this.origin]
    return gameOfOrigin ? `Pokémon ${gameOfOrigin.name}` : '(Unknown Game)'
  }

  static saveTypeName = 'Pokémon Ruby/Sapphire/Emerald/FireRed/LeafGreen'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length !== SAVE_SIZE_BYTES) {
      return false
    }
    const valueAtAC = bytesToUint32LittleEndian(bytes, 0xac)
    if (valueAtAC === 1 || valueAtAC === 0) {
      return true
    }
    for (let i = 0x890; i < 0xf2c; i += 4) {
      if (bytesToUint64LittleEndian(bytes, i) !== 0) return true
    }
    return false
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.Ruby:
        return '#CD2236'
      case GameOfOrigin.Sapphire:
        return '#009652'
      case GameOfOrigin.Emerald:
        return '#009652'
      case GameOfOrigin.FireRed:
        return '#F15C01'
      case GameOfOrigin.LeafGreen:
        return '#9FDC00'
      default:
        return '#666666'
    }
  }

  static includesOrigin(origin: GameOfOrigin) {
    return origin >= GameOfOrigin.Sapphire && origin <= GameOfOrigin.LeafGreen
  }
}
