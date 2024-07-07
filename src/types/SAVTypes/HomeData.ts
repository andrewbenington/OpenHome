import lodash from 'lodash'
import { getMonFileIdentifier } from '../../util/Lookup'
import { OHPKM } from '../pkm/OHPKM'
import { Box, BoxCoordinates, SAV } from './SAV'
import { emptyParsedPath } from './path'

export class HomeBox implements Box<OHPKM> {
  name: string

  pokemon: Array<OHPKM | undefined> = new Array(120)

  constructor(n: string) {
    this.name = n
  }

  writeMonsToString() {
    return this.pokemon
      .map((mon, i) => {
        if (mon) {
          return `${i.toString()},${getMonFileIdentifier(mon) ?? ''}\n`
        }
        return ''
      })
      .join('')
  }

  getMonsFromString(fileString: string, monMap: { [key: string]: OHPKM }) {
    this.pokemon = new Array(120)
    fileString.split('\n').forEach((monAndIndex) => {
      const [indexStr, monRef] = monAndIndex.split(',')
      const mon = monMap[monRef]
      const index = parseInt(indexStr)
      if (!Number.isNaN(index) && mon) {
        this.pokemon[index] = mon
      }
    })
  }
}

export class HomeData extends SAV<OHPKM> {
  updatedBoxSlots: BoxCoordinates[] = []

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
