import { GameOfOrigin } from 'pokemon-resources'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { PersistedPkmData } from '../../state/persistedPkmData'
import { TransferRestrictions } from '../TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import { BoxMonIdentifiers, getBankName, OpenHomeBank } from '../storage'
import { Box } from './SAV'
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
      } else {
        console.error()
      }
    })
  }

  firstOpenIndex(): number | undefined {
    return this.pokemon.findIndex((value) => value === undefined)
  }
}

export class HomeData {
  origin: GameOfOrigin = 0
  isPlugin = false

  static BOX_ROWS = 10
  static BOX_COLUMNS = 12

  boxRows = HomeData.BOX_ROWS
  boxColumns = HomeData.BOX_COLUMNS

  transferRestrictions: TransferRestrictions = {}

  filePath: PathData = emptyPathData
  fileCreated?: Date

  money: number = 0
  name: string = 'OpenHome'
  tid: number = 575757
  sid?: number = 575757
  displayID: string = '575757'

  currentPCBox: number = 0
  boxes: Array<HomeBox> = []
  currentBankIndex: number = 0
  banks: OpenHomeBank[]

  bytes: Uint8Array = new Uint8Array()

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BankBoxCoordinates[] = []

  constructor(all_bank_metadata: OpenHomeBank[], mon_lookup: PersistedPkmData) {
    this.banks = all_bank_metadata
    this.setAndLoadBank(0, mon_lookup)
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

  getCurrentBankName() {
    return getBankName(this.banks[this.currentBankIndex])
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

  addBank(name: string | undefined, box_count: number) {
    const newBank = {
      name,
      index: this.banks.length,
      boxes: range(box_count).map((_, index) => ({
        name: undefined,
        index,
        identifiers: {},
      })),
    }

    this.banks.push(newBank)
    return newBank
  }

  setAndLoadBank(bank_index: number, mon_lookup: PersistedPkmData) {
    this.currentBankIndex = bank_index
    this.currentPCBox = 0
    // console.log(this.banks, this.banks[bank_index], this.banks[bank_index].boxes)
    const bankBoxes = this.banks[bank_index].boxes.sort((box_metadata) => box_metadata.index)

    this.boxes = bankBoxes.map(
      (box_metadata) =>
        new HomeBox(box_metadata.name ?? `Box ${box_metadata.index + 1}`, box_metadata.index)
    )
    bankBoxes.forEach((box_metadata) => {
      this.boxes[box_metadata.index].loadMonsFromIdentifiers(box_metadata.identifiers, mon_lookup)
    })
  }

  setPokemon(location: BankBoxCoordinates, mon: OHPKM | undefined) {
    if (location.box_slot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.box_slot} exceeds box size (${HomeData.BOX_COLUMNS * HomeData.BOX_ROWS}))`
      )
    }

    if (location.bank >= this.banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this.banks.length} banks total)`
      )
    }

    const bankToUpdate = this.banks[location.bank]

    if (location.box >= bankToUpdate.boxes.length) {
      throw new Error(
        `Cannot access box at index ${location.box} (${bankToUpdate.name} has ${bankToUpdate.boxes.length} boxes total)`
      )
    }

    if (mon) {
      this.banks[location.bank].boxes[location.box].identifiers[location.box_slot] =
        getMonFileIdentifier(mon) as string
      if (location.bank === this.currentBankIndex) {
        this.boxes[location.box].pokemon[location.box_slot] = mon
        bankToUpdate
      }
    } else {
      delete this.banks[location.bank].boxes[location.box].identifiers[location.box_slot]
      if (location.bank === this.currentBankIndex) {
        this.boxes[location.box].pokemon[location.box_slot] = undefined
      }
    }
  }

  slotIsEmpty(location: BankBoxCoordinates): boolean {
    if (location.box_slot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.box_slot} exceeds box size (${HomeData.BOX_COLUMNS * HomeData.BOX_ROWS}))`
      )
    }

    if (location.bank >= this.banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this.banks.length} banks total)`
      )
    }

    const bank = this.banks[location.bank]

    if (location.box >= bank.boxes.length) {
      throw new Error(
        `Cannot access box at index ${location.box} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    return bank.boxes[location.box].identifiers[location.box_slot] === undefined
  }

  displayState() {
    return {
      currentBox: this.currentPCBox,
      currentBankIndex: this.currentBankIndex,
      currentBank: this.getCurrentBank(),
      boxCount: this.boxes.length,
    }
  }
}

export interface BankBoxCoordinates {
  bank: number
  box: number
  box_slot: number
}

export function bankBoxCoordinates(
  bank: number,
  box: number,
  box_slot: number
): BankBoxCoordinates {
  return { bank, box, box_slot }
}

function range(size: number) {
  return [...Array(size).keys()]
}
