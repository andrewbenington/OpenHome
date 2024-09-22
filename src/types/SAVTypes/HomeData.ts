import lodash from 'lodash'
import { getMonFileIdentifier } from '../../util/Lookup'
import { OHPKM } from '../pkm/OHPKM'
import { BoxMonIdentifiers } from '../storage'
import { SaveType } from '../types'
import { Box, BoxCoordinates, SAV } from './SAV'
import { emptyParsedPath } from './path'

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

export class HomeData extends SAV<OHPKM> {
  updatedBoxSlots: BoxCoordinates[] = []

  saveType = SaveType.OPENHOME

  boxRows = 10

  boxColumns = 12

  boxes: Array<HomeBox>

  currentPCBox: number = 0

  constructor() {
    super(emptyParsedPath, new Uint8Array())
    this.boxNames = lodash.range(36).map((i) => `Box ${i + 1}`)
    this.boxes = this.boxNames.map((name) => new HomeBox(name))
  }
}
