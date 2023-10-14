import _ from 'lodash'
import { OHPKM } from '../../types/PKMTypes/OHPKM'
import { getMonFileIdentifier } from '../../util/Lookup'
import { Box, BoxCoordinates, SAV } from './SAV'

export class HomeBox implements Box {
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

export class HomeData extends SAV {
  updatedBoxSlots: BoxCoordinates[] = []

  boxRows = 10

  boxColumns = 12

  boxes: Array<HomeBox>

  constructor() {
    super('', new Uint8Array())
    this.boxNames = _.range(36).map((i) => `Box ${i + 1}`)
    this.boxes = this.boxNames.map((name) => new HomeBox(name))
  }
}
