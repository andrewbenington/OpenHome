import { GameOfOrigin } from 'pokemon-resources'
import { getMonFileIdentifier } from 'src/util/Lookup'
import { PersistedPkmData } from '../../state/persistedPkmData'
import { TransferRestrictions } from '../TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import { BoxMonIdentifiers, getBankName, OpenHomeBank, StoredBankData } from '../storage'
import { Err, Errorable, Ok } from '../types'
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

  _currentBoxIndex: number = 0
  boxes: Array<HomeBox> = []
  _currentBankIndex: number = 0
  private _banks: OpenHomeBank[]

  bytes: Uint8Array = new Uint8Array()

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BankBoxCoordinates[] = []

  constructor(stored_bank_data: StoredBankData, mon_lookup: PersistedPkmData) {
    this._banks = stored_bank_data.banks
    this.setAndLoadBank(stored_bank_data.current_bank, mon_lookup)
  }
  pluginIdentifier?: string | undefined
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculatePcChecksum?: (() => number) | undefined

  getCurrentBox() {
    return this.boxes[this._currentBoxIndex]
  }

  getCurrentBank() {
    return this._banks[this._currentBankIndex]
  }

  getCurrentBankName() {
    return getBankName(this._banks[this._currentBankIndex])
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
    const newBank: OpenHomeBank = {
      name,
      index: this._banks.length,
      boxes: range(box_count).map((_, index) => ({
        name: undefined,
        index,
        identifiers: {},
      })),
      current_box: 0,
    }

    this._banks.push(newBank)
    return newBank
  }

  setAndLoadBank(bank_index: number, mon_lookup: PersistedPkmData) {
    this._currentBankIndex = bank_index
    this._currentBoxIndex = this._banks[bank_index].current_box
    // console.log(this._banks, this._banks[bank_index], this._banks[bank_index].boxes)
    const bankBoxes = this._banks[bank_index].boxes.sort((box_metadata) => box_metadata.index)

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

    if (location.bank >= this._banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this._banks.length} banks total)`
      )
    }

    const bankToUpdate = this._banks[location.bank]

    if (location.box >= bankToUpdate.boxes.length) {
      throw new Error(
        `Cannot access box at index ${location.box} (${bankToUpdate.name} has ${bankToUpdate.boxes.length} boxes total)`
      )
    }

    if (mon) {
      this._banks[location.bank].boxes[location.box].identifiers[location.box_slot] =
        getMonFileIdentifier(mon) as string
      if (location.bank === this._currentBankIndex) {
        this.boxes[location.box].pokemon[location.box_slot] = mon
        bankToUpdate
      }
    } else {
      delete this._banks[location.bank].boxes[location.box].identifiers[location.box_slot]
      if (location.bank === this._currentBankIndex) {
        this.boxes[location.box].pokemon[location.box_slot] = undefined
      }
    }
  }

  setBankName(bank_index: number, name: string | undefined): Errorable<null> {
    if (this._banks.length <= bank_index) {
      return Err(`Cannot access bank at index ${bank_index} (${this._banks.length} banks total)`)
    }

    this._banks[bank_index].name = name

    return Ok(null)
  }

  slotIsEmpty(location: BankBoxCoordinates): boolean {
    if (location.box_slot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.box_slot} exceeds box size (${HomeData.BOX_COLUMNS * HomeData.BOX_ROWS}))`
      )
    }

    if (location.bank >= this._banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this._banks.length} banks total)`
      )
    }

    const bank = this._banks[location.bank]

    if (location.box >= bank.boxes.length) {
      throw new Error(
        `Cannot access box at index ${location.box} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    return bank.boxes[location.box].identifiers[location.box_slot] === undefined
  }

  displayState() {
    return {
      currentBox: this._currentBoxIndex,
      _currentBankIndex: this._currentBankIndex,
      currentBank: this.getCurrentBank(),
      boxCount: this.boxes.length,
    }
  }

  public get banks() {
    return this._banks
  }

  public get currentBoxIndex() {
    return this._currentBoxIndex
  }

  public set currentBoxIndex(index: number) {
    if (index >= this.getCurrentBank().boxes.length) {
      throw new Error(
        `Cannot access box at index ${index} (${this.getCurrentBankName()} has ${this.getCurrentBank().boxes.length} boxes total)`
      )
    }
    this._currentBoxIndex = index
    this._banks[this._currentBankIndex].current_box = index
  }

  public get currentBankIndex() {
    return this._currentBankIndex
  }

  public set currentBankIndex(index: number) {
    if (index >= this._banks.length) {
      throw new Error(`Cannot access bank at index ${index} (${this._banks.length} banks total)`)
    }
    this._currentBankIndex = index
  }

  public get currentPCBox() {
    return this._currentBoxIndex
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
