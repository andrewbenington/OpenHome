import { GameOfOrigin } from 'pokemon-resources'
import { OHPKM } from '../../pkm/OHPKM'
import { PathData } from '../path'
import { Box, BoxCoordinates, PluginSAV } from '../SAV'
import PK3UB from './PK3UB'

export class G3UBSAV implements PluginSAV<PK3UB> {
  origin: GameOfOrigin = 0
  boxRows!: number
  boxColumns!: number
  filePath!: PathData
  fileCreated?: Date | undefined
  money!: number
  name!: string
  tid!: number
  sid?: number | undefined
  displayID!: string
  currentPCBox!: number
  boxes: Box<PK3UB>[] = []
  bytes!: Uint8Array<ArrayBufferLike>
  invalid: boolean = false
  tooEarlyToOpen: boolean = false
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  updatedBoxSlots: BoxCoordinates[] = []
  gameColor!: () => string
  isPlugin: true = true
  getCurrentBox!: () => Box<PK3UB>
  supportsMon!: (dexNumber: number, formeNumber: number) => boolean
  prepareBoxesAndGetModified!: () => OHPKM[]
  calculateChecksum?: (() => number) | undefined
  getGameName!: () => string
  getExtraData?: (() => object) | undefined

  getPluginIdentifier() {
    return 'unbound'
  }

  static saveTypeID = 'G3UBSAV'
}
