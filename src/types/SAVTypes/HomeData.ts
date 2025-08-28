import lodash from 'lodash'
import { GameOfOrigin } from 'pokemon-resources'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { numericSorter } from '../../util/Sort'
import { TransferRestrictions } from '../TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import { BoxMonIdentifiers, OpenHomeBank } from '../storage'
import { Box, BoxCoordinates, SAV } from './SAV'
import { emptyPathData, PathData } from './path'

export class HomeBox implements Box<OHPKM> {
  name: string | undefined
  index: number

  pokemon: Array<OHPKM | undefined> = new Array(120)

  constructor(name: string, index: number) {
    if (name !== `Box ${index + 1}`) {
      this.name = name
    }
    this.index = index
  }

  getIdentifierMapping(): BoxMonIdentifiers {
    const entries = this.pokemon
      .map(
        (mon, i) => [i, mon ? getMonFileIdentifier(mon) : undefined] as [number, string | undefined]
      )
      .filter(([, identifier]) => !!identifier) as [number, string][]

    return Object.fromEntries(entries)
  }

  loadMonsFromIdentifiers(boxIdentifers: BoxMonIdentifiers, monMap: { [key: string]: OHPKM }) {
    this.pokemon = new Array(120)
    Object.entries(boxIdentifers).forEach(([indexStr, identifier]) => {
      const mon = monMap[identifier]
      const index = parseInt(indexStr)

      if (!Number.isNaN(index) && mon) {
        this.pokemon[index] = mon
      }
    })
  }

  firstOpenIndex(): number | undefined {
    return this.pokemon.findIndex((value) => value === undefined)
  }
}

export class HomeData implements SAV<OHPKM> {
  origin: GameOfOrigin = 0
  isPlugin = false

  boxRows = 10
  boxColumns = 12

  transferRestrictions: TransferRestrictions = {}

  filePath: PathData = emptyPathData
  fileCreated?: Date

  money: number = 0
  name: string = 'OpenHome'
  tid: number = 575757
  sid?: number = 575757
  displayID: string = '575757'

  currentPCBox: number = 0
  boxNames: string[]
  boxes: Array<HomeBox>
  currentBankIndex: number = 0
  banks: OpenHomeBank[]

  bytes: Uint8Array = new Uint8Array()

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor(bankData: OpenHomeBank[]) {
    this.banks = bankData
    const sortedBoxData = bankData[0].boxes?.sort(
      numericSorter((box) => (box.index === undefined ? Number.NEGATIVE_INFINITY : box.index))
    )

    if (sortedBoxData) {
      this.boxNames = sortedBoxData?.map((box, i) => box.name ?? `Box ${i + 1}`)
    } else {
      this.boxNames = lodash.range(36).map((i) => `Box ${i + 1}`)
    }
    this.boxes = this.boxNames.map((name, i) => new HomeBox(name, i))
  }
  pluginIdentifier?: string | undefined
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculatePcChecksum?: (() => number) | undefined

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
  }

  getCurrentBank() {
    return this.banks[this.currentBankIndex]
  }

  getGameName() {
    return 'OpenHome'
  }

  prepareBoxesAndGetModified() {
    return []
  }

  supportsMon() {
    return true
  }

  gameColor() {
    return '#7DCEAB'
  }

  getPluginIdentifier() {
    return undefined
  }

  addBank(name?: string, box_count: number = 30) {
    this.banks.push({
      name,
      index: this.banks.length,
      boxes: Array(box_count).map((_, index) => ({ name: undefined, index, identifiers: {} })),
    })
  }
}
