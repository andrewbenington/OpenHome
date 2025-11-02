import { getHomeIdentifier, getMonFileIdentifier } from 'src/util/Lookup'
import { v4 as UuidV4 } from 'uuid'
import { PersistedPkmData } from '../../state/persistedPkmData'
import { range } from '../../util/Functional'
import { filterUndefined, numericSorter } from '../../util/Sort'
import { TransferRestrictions } from '../TransferRestrictions'
import { OHPKM } from '../pkm/OHPKM'
import {
  BoxCustomization,
  BoxMonIdentifiers,
  getBankName,
  OpenHomeBank,
  OpenHomeBox,
  StoredBankData,
} from '../storage'
import { Err, Errorable, Ok } from '../types'
import { Box } from './SAV'

export class HomeBox implements Box<OHPKM> {
  id: string
  name: string | undefined
  index: number
  customization: BoxCustomization | null

  pokemon: Array<OHPKM | undefined> = new Array(120)

  constructor(
    id: string,
    name: string | null | undefined,
    index: number,
    customization: BoxCustomization | null | undefined
  ) {
    if (name !== `Box ${index + 1}`) {
      this.name = name ?? undefined
    }

    this.id = id
    this.index = index
    this.customization = customization ?? null
  }

  static fromStored(homeBox: OpenHomeBox) {
    const { id, name: storedName, index, customization } = homeBox
    const name = storedName !== `Box ${index + 1}` ? storedName : undefined
    return new HomeBox(id, name, index, customization)
  }

  getIdentifierMapping(): BoxMonIdentifiers {
    const entries = this.pokemon
      .map(
        (mon, i) => [i, mon ? getHomeIdentifier(mon) : undefined] as [number, string | undefined]
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

  getMonCount() {
    return this.pokemon.filter(filterUndefined).length
  }
}

export class HomeData {
  static BOX_ROWS = 10
  static BOX_COLUMNS = 12

  boxRows = HomeData.BOX_ROWS
  boxColumns = HomeData.BOX_COLUMNS

  transferRestrictions: TransferRestrictions = {}

  _currentBoxIndex: number = 0
  boxes: Array<HomeBox> = []
  _currentBankIndex: number = 0
  private _banks: OpenHomeBank[]

  bytes: Uint8Array = new Uint8Array()

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BankBoxCoordinates[] = []

  constructor(stored_bank_data: StoredBankData, mon_lookup: PersistedPkmData) {
    this._banks = stored_bank_data.banks.map((bank) => ({
      ...bank,
      boxes: bank.boxes.map((box) => ({ ...box, last_saved_index: box.index })),
    }))
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

  gameColor() {
    return '#7DCEAB'
  }

  addBank(name: string | undefined, box_count: number) {
    const newBank: OpenHomeBank = {
      id: UuidV4(),
      name,
      index: this._banks.length,
      boxes: range(box_count).map((_, index) => ({
        id: UuidV4(),
        name: null,
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

    this.boxes = bankBoxes.map(HomeBox.fromStored)
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

  setBoxNameCurrentBank(box_index: number, name: string | undefined): Errorable<null> {
    const bank = this.getCurrentBank()

    if (box_index >= bank.boxes.length) {
      return Err(
        `Cannot access box at index ${box_index} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    this.boxes[box_index].name = name || undefined
    this.boxes = [...this.boxes]
    this.syncBankToBoxes()

    return Ok(null)
  }

  setBoxColorCurrentBank(box_index: number, color: string | undefined): Errorable<null> {
    const bank = this.getCurrentBank()

    if (box_index >= bank.boxes.length) {
      return Err(
        `Cannot access box at index ${box_index} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    const currentCustomization = this.boxes[box_index].customization ?? {}
    this.boxes[box_index].customization = { ...currentCustomization, color }
    this.boxes = [...this.boxes]
    this.syncBankToBoxes()

    return Ok(null)
  }

  deleteBoxCurrentBank(box_index: number, box_id: string): Errorable<null> {
    const bank = this.getCurrentBank()

    if (box_index >= bank.boxes.length) {
      return Err(
        `Cannot access box at index ${box_index} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    const monCount = this.boxes[box_index].getMonCount()

    if (monCount > 0) {
      return Err(`Cannot delete box; ${monCount} Pokémon present`)
    }

    if (this.boxes[box_index].id !== box_id) {
      return Err(`Box id and index mismatch`)
    }
    this.boxes = [...this.boxes.filter((box) => box.id !== box_id)]
    this.indexAndSyncBoxes()
    this.syncBankToBoxes()

    return Ok(null)
  }

  addBoxCurrentBank(): Errorable<null> {
    const newBox = new HomeBox(UuidV4(), null, this.boxes.length, null)
    this.boxes = [...this.boxes, newBox]
    this.indexAndSyncBoxes()

    return Ok(null)
  }

  reorderBoxesCurrentBank(ids_in_new_order: string[]) {
    this.boxes = this.boxes.toSorted(numericSorter((box) => ids_in_new_order.indexOf(box.id)))
    this.indexAndSyncBoxes()
  }

  indexAndSyncBoxes() {
    this.boxes.forEach((box, newIndex) => (box.index = newIndex))
    this.syncBankToBoxes()
  }

  currentBoxRemoveDupes() {
    const alreadyPresent: Set<string> = new Set()

    for (let slot = 0; slot < HomeData.BOX_COLUMNS * HomeData.BOX_ROWS; slot++) {
      const mon = this.boxes[this.currentPCBox].pokemon[slot]

      if (!mon) continue

      const identifier = getMonFileIdentifier(mon)

      if (!identifier) continue
      if (alreadyPresent.has(identifier)) {
        this.boxes[this.currentPCBox].pokemon[slot] = undefined
      } else {
        alreadyPresent.add(identifier)
      }
    }

    this.boxes = [...this.boxes]
    this.syncBankToBoxes()
  }

  syncBankToBoxes() {
    this._banks[this._currentBankIndex].boxes = this.boxes.map((box) => ({
      id: box.id,
      index: box.index,
      name: box.name || null,
      identifiers: box.getIdentifierMapping(),
      customization: box.customization ?? undefined,
    }))
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

  clone() {
    const newHomeData = new HomeData({ banks: this._banks, current_bank: 0 }, {})

    newHomeData._currentBankIndex = this._currentBankIndex
    newHomeData._currentBoxIndex = this._currentBoxIndex
    newHomeData.boxes = [...this.boxes]
    newHomeData.updatedBoxSlots = this.updatedBoxSlots

    return newHomeData
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
