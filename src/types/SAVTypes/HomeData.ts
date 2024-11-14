import lodash from 'lodash'
import { GameOfOrigin } from 'pokemon-resources'
import { getMonFileIdentifier } from '../../util/Lookup'
import { TransferRestrictions } from '../TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import { BoxMonIdentifiers } from '../storage'
import { Box, BoxCoordinates, SAV } from './SAV'
import { emptyParsedPath, ParsedPath } from './path'

export class HomeBox implements Box<OHPKM> {
  name: string

  pokemon: Array<OHPKM | undefined> = new Array(120)

  constructor(n: string) {
    this.name = n
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
}

export class HomeData implements SAV<OHPKM> {
  origin: GameOfOrigin = 0

  boxRows = 10
  boxColumns = 12

  transferRestrictions: TransferRestrictions = {}

  filePath: ParsedPath = emptyParsedPath
  fileCreated?: Date

  money: number = 0
  name: string = 'OpenHome'
  tid: number = 575757
  sid?: number = 575757
  displayID: string = '575757'

  currentPCBox: number = 0
  boxNames: string[]
  boxes: Array<HomeBox>

  bytes: Uint8Array = new Uint8Array()

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BoxCoordinates[] = []

  constructor() {
    this.boxNames = lodash.range(36).map((i) => `Box ${i + 1}`)
    this.boxes = this.boxNames.map((name) => new HomeBox(name))
  }

  getCurrentBox() {
    return this.boxes[this.currentPCBox]
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
}
