import { GameOfOrigin, NDex } from '../../consts'
import { OHPKM } from '../../types/PKMTypes/OHPKM'
import { CapPikachus, RegionalForms } from '../../types/TransferRestrictions'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from '../../util/ByteLogic'
import { gen3StringToUTF } from '../../util/Strings/StringConverter'
import { PK3 } from '../PKMTypes/PK3'
import { SaveType } from '../types'
import { Box, SAV } from './SAV'

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

  boxNames: string[]

  saveType: SaveType

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
    this.boxNames = []
    for (let i = 0; i < 14; i++) {
      this.boxes[i] = new Box(gen3StringToUTF(this.pcDataContiguous, 0x8344 + i * 9, 10), 30)
    }
    for (let i = 0; i < 420; i++) {
      try {
        const mon = new PK3(this.pcDataContiguous.slice(4 + i * 80, 4 + (i + 1) * 80), true)
        if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
          const box = this.boxes[Math.floor(i / 30)]
          box.pokemon[i % 30] = mon
        }
      } catch (e) {
        console.error(e)
      }
    }
    switch (bytesToUint32LittleEndian(this.sectors[0].data, 0xac)) {
      case 0:
        this.saveType = SaveType.RS
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x490)
        break
      case 1:
        this.saveType = SaveType.FRLG
        this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, 0xaf8)
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x290) ^ this.securityKey
        break
      default:
        this.saveType = SaveType.E
        this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, 0xac)
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x490) ^ this.securityKey
        break
    }
    this.name = gen3StringToUTF(this.sectors[0].data, 0x00, 7)
    this.tid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0a)
    this.sid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0c)
  }
}

export class G3SAV extends SAV<PK3> {
  static TRANSFER_RESTRICTIONS = {
    maxDexNum: NDex.DEOXYS,
    excludedForms: { ...RegionalForms, ...CapPikachus },
  }

  static TRAINER_OFFSET = 0x0ff4 * 0

  static TEAM_ITEMS_OFFSET = 0x0ff4 * 1

  static PC_OFFSET = 0x0ff4 * 5

  saveType: SaveType

  pkmType = PK3

  transferRestrictions = G3SAV.TRANSFER_RESTRICTIONS

  primarySave: G3SaveBackup

  backupSave: G3SaveBackup

  primarySaveOffset: number

  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes)
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
    this.saveType = this.primarySave.saveType
    this.currentPCBox = this.primarySave.currentPCBox
    this.money = this.primarySave.money
    this.name = this.primarySave.name
    this.tid = this.primarySave.tid
    this.displayID = this.primarySave.tid.toString().padStart(5, '0')
    this.sid = this.primarySave.sid
    this.currentPCBox = this.primarySave.currentPCBox
    this.boxes = this.primarySave.boxes
    this.boxNames = this.primarySave.boxNames
    if (this.saveType === SaveType.E) {
      this.origin = GameOfOrigin.Emerald
      return
    }
    // hacky way to detect save version
    this.boxes.forEach((box) => {
      box.pokemon.forEach((mon) => {
        if (
          mon &&
          mon.trainerID === this.tid &&
          mon.secretID === this.tid &&
          mon.trainerName === this.name
        ) {
          this.origin = mon.gameOfOrigin
        }
      })
    })
    const filePathElements = this.filePath.split('/')
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
    }
  }

  prepareBoxesForSaving() {
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
      if (changedMon) {
        const slotMon = this.boxes[box].pokemon[index]
        try {
          const mon = slotMon instanceof PK3 ? slotMon : new PK3(undefined, undefined, slotMon)
          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum()
            pcBytes.set(mon.toPCBytes(), 0)
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
}
