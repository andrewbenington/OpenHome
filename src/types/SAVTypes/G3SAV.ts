import { OriginGame } from '@pkm-rs-resources/pkg'
import { PK3 } from '@pokemon-files/pkm'
import { NationalDex } from 'src/consts/NationalDex'
import { GEN3_TRANSFER_RESTRICTIONS } from 'src/consts/TransferRestrictions'
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  uint16ToBytesLittleEndian,
  uint32ToBytesLittleEndian,
} from 'src/util/byteLogic'
import { gen3StringToUTF } from 'src/util/Strings/StringConverter'
import { OHPKM } from '../pkm/OHPKM'
import { emptyPathData, PathData } from './path'
import { Box, BoxCoordinates, OfficialSAV } from './SAV'
import { LOOKUP_TYPE } from './util'

export const SAVE_SIZE_BYTES = 0x20000
export const EMERALD_SECURITY_OFFSET = 0xac
export const EMERALD_SECURITY_COPY_OFFSET = 0x01f4
export const FRLG_SECURITY_OFFSET = 0x0af8
export const FRLG_SECURITY_COPY_OFFSET = 0x0f20

const MAX_ADDITIONAL_BYTES = 0x100

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
  origin: OriginGame

  bytes: Uint8Array

  saveIndex: number = 0

  isFirstSave: boolean = false

  gameCode: number = 0
  securityKey: number = 0
  securityKeyCopy?: number

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
    this.sectors = []
    for (let i = 0; i < 14; i++) {
      this.sectors.push(new G3Sector(bytes, i))
      this.firstSectorIndex = this.sectors[0].sectionID
    }
    this.sectors.sort((sector1, sector2) => sector1.sectionID - sector2.sectionID)

    this.gameCode = bytesToUint32LittleEndian(this.sectors[0].data, 0xac)
    switch (this.gameCode) {
      case 0:
        this.origin = OriginGame.Ruby
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x490)
        break
      case 1:
        this.origin = OriginGame.FireRed
        this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, FRLG_SECURITY_OFFSET)
        this.securityKeyCopy = bytesToUint32LittleEndian(
          this.sectors[0].data,
          FRLG_SECURITY_COPY_OFFSET
        )
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x290) ^ this.securityKey
        break
      default:
        this.origin = OriginGame.Emerald
        this.securityKey = bytesToUint32LittleEndian(this.sectors[0].data, EMERALD_SECURITY_OFFSET)
        this.securityKeyCopy = bytesToUint32LittleEndian(
          this.sectors[0].data,
          EMERALD_SECURITY_COPY_OFFSET
        )
        this.money = bytesToUint32LittleEndian(this.sectors[1].data, 0x490) ^ this.securityKey
        break
    }

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

        const box = this.boxes[Math.floor(i / 30)]

        if (mon.isValid()) {
          box.pokemon[i % 30] = mon
        } else {
          box.pokemon[i % 30] = undefined
        }
      } catch (e) {
        throw Error(`File does not have valid Pokémon data: ${e}`)
      }
    }

    this.name = gen3StringToUTF(this.sectors[0].data, 0x00, 7)
    this.tid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0a)
    this.sid = bytesToUint16LittleEndian(this.sectors[0].data, 0x0c)
  }
}

export class G3SAV extends OfficialSAV<PK3> {
  static pkmType = PK3

  static transferRestrictions = GEN3_TRANSFER_RESTRICTIONS
  static lookupType: LOOKUP_TYPE = 'gen345'

  static TRAINER_OFFSET = 0x0ff4 * 0

  static TEAM_ITEMS_OFFSET = 0x0ff4 * 1

  static PC_OFFSET = 0x0ff4 * 5

  primarySave: G3SaveBackup

  backupSave: G3SaveBackup

  primarySaveOffset: number

  origin: OriginGame
  isPlugin: false = false

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
  boxes: Array<Box<PK3>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super()
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
      let fileName = this.filePath.name

      fileName = fileName.replace(/\s+/g, '')
      if (fileName.includes('Ruby')) {
        this.origin = OriginGame.Ruby
        return
      }
      if (fileName.includes('Sapphire')) {
        this.origin = OriginGame.Sapphire
        return
      }
      if (fileName.includes('FireRed')) {
        this.origin = OriginGame.FireRed
        return
      }
      if (fileName.includes('LeafGreen')) {
        this.origin = OriginGame.LeafGreen
      } else {
        this.origin = this.primarySave.origin
      }
    }
  }

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
    return dexNumber <= NationalDex.Deoxys && (formeNumber === 0 || dexNumber === NationalDex.Unown)
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  static saveTypeAbbreviation = 'RSE/FRLG'
  static saveTypeName = 'Pokémon Ruby/Sapphire/Emerald/FireRed/LeafGreen'
  static saveTypeID = 'G3SAV'

  static fileIsSave(bytes: Uint8Array): boolean {
    if (bytes.length < SAVE_SIZE_BYTES || bytes.length - SAVE_SIZE_BYTES > MAX_ADDITIONAL_BYTES) {
      return false
    }
    try {
      const save = new G3SAV(emptyPathData, bytes)

      if (save.primarySave.gameCode === 0) {
        return true
      }
      return save.primarySave.securityKey > 0
    } catch {
      return false
    }
  }

  static includesOrigin(origin: OriginGame) {
    return origin >= OriginGame.Sapphire && origin <= OriginGame.LeafGreen
  }

  getDisplayData(): Record<string, string | number | undefined> {
    return {
      ...super.getDisplayData(),
      securityKey: this.primarySave.securityKey,
      securityKeyCopyEmerald: new DataView(
        this.primarySave.sectors[0].data.buffer as ArrayBuffer
      ).getUint32(0x1f4, true),
      securityKeyCopyFRLG: new DataView(
        this.primarySave.sectors[0].data.buffer as ArrayBuffer
      ).getUint32(0xf20, true),
      rivalName: gen3StringToUTF(this.primarySave.sectors[3].data, 0x0bcc, 8),
      gameCode: this.primarySave.gameCode,
    }
  }
}
