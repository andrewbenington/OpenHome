import { AllPKMFields, PA8, PB8, PK8 } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'
import { OHPKM } from '../../pkm/OHPKM'
import { PathData } from '../path'
import { Box, BoxCoordinates, SAV } from '../SAV'
import { BoxNamesBlock } from './BoxNamesBlock'
import { SCArrayBlock, SCBlock, SCObjectBlock, SCValueBlock } from './SwishCrypto/SCBlock'
import { SwishCrypto } from './SwishCrypto/SwishCrypto'

export abstract class G8SAV<P extends PK8 | PB8 | PA8> implements SAV<P> {
  origin: GameOfOrigin = 0
  isPlugin = false

  boxRows = 5
  boxColumns = 6
  abstract getBoxCount(): number

  filePath: PathData
  fileCreated?: Date

  scBlocks: SCBlock[]

  money: number = 0
  name: string = ''
  tid: number = 0
  sid: number = 0
  displayID: string = ''

  currentPCBox: number = 0 // TODO: Gen 8 current box

  boxes: Array<Box<P>>

  bytes: Uint8Array

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    this.bytes = bytes
    this.filePath = path
    this.scBlocks = SwishCrypto.decrypt(bytes)

    const currentPCBlock = this.getBlockMust<SCValueBlock>('CurrentBox', 'value')

    this.currentPCBox = new DataView(currentPCBlock.raw).getUint8(0)

    const boxNamesBlock = new BoxNamesBlock(this.getBlockMust<SCArrayBlock>('BoxLayout', 'array'))

    const boxBlock = this.getBlockMust<SCObjectBlock>('Box', 'object')

    this.boxes = Array(this.getBoxCount())
    for (let box = 0; box < this.getBoxCount(); box++) {
      const boxName = boxNamesBlock.getBoxName(box)

      this.boxes[box] = new Box(boxName, 30)
    }

    for (let box = 0; box < this.getBoxCount(); box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * monIndex
          const endByte = startByte + this.getMonBoxSizeBytes()
          const monData = boxBlock.raw.slice(startByte, endByte)
          const mon = this.monConstructor(monData, true)

          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  abstract getMonBoxSizeBytes(): number
  abstract getBoxSizeBytes(): number

  abstract getBlockMust<T extends SCBlock = SCBlock>(
    blockName: G8BlockName,
    type?: T['blockType']
  ): T

  abstract supportsMon(dexNumber: number, formeNumber: number): boolean

  abstract getCurrentBox(): Box<P>

  abstract getGameName(): string

  abstract monConstructor(arg: ArrayBuffer | AllPKMFields, encrypted?: boolean): P

  prepareBoxesAndGetModified() {
    const changedMonPKMs: OHPKM[] = []
    const boxBlock = this.getBlockMust<SCObjectBlock>('Box', 'object')

    this.updatedBoxSlots.forEach(({ box, index }) => {
      const changedMon = this.boxes[box].pokemon[index]

      // we don't want to save OHPKM files of mons that didn't leave the save
      // (and would still be PK8/PA8s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon)
      }

      const writeIndex = this.getBoxSizeBytes() * box + this.getMonBoxSizeBytes() * index
      const blockBuffer = new Uint8Array(boxBlock.raw)

      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (changedMon) {
        try {
          const mon = changedMon instanceof OHPKM ? this.monConstructor(changedMon) : changedMon

          if (mon?.gameOfOrigin && mon?.dexNum) {
            if ('stats' in mon) {
              mon.stats = mon.getStats()
            }
            mon.refreshChecksum()
            const monBuffer = new Uint8Array(this.getMonBoxSizeBytes())
            const pcBytes = mon.toPCBytes()

            monBuffer.set(new Uint8Array(pcBytes), 0)
            blockBuffer.set(monBuffer, writeIndex)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        const mon = this.monConstructor(new Uint8Array(this.getMonBoxSizeBytes()).buffer)

        mon.refreshChecksum()
        blockBuffer.set(new Uint8Array(mon.toPCBytes()), writeIndex)
      }
    })

    this.bytes = SwishCrypto.encrypt(this.scBlocks, this.bytes.length)

    return changedMonPKMs
  }

  gameColor() {
    switch (this.origin) {
      case GameOfOrigin.Sword:
        return '#006998'
      case GameOfOrigin.Shield:
        return '#7C0033'
      case GameOfOrigin.LegendsArceus:
        return '#36597B'
      default:
        return '#666666'
    }
  }

  getPluginIdentifier() {
    return undefined
  }
}

export type G8BlockName = 'BoxLayout' | 'Box' | 'CurrentBox'
