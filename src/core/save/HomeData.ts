import { getHomeIdentifier, getMonFileIdentifier } from '@openhome/core/pkm/Lookup'
import { OHPKM } from '@openhome/core/pkm/OHPKM'
import { TransferRestrictions } from '@openhome/core/save/util/TransferRestrictions'
import { range } from '@openhome/core/util/functional'
import { filterUndefined, numericSorter } from '@openhome/core/util/sort'
import { OhpkmLookup } from '@openhome/ui/state/ohpkm/useOhpkmStore'
import { MonLocation } from '@openhome/ui/state/saves/reducer'
import {
  BoxMonIdentifiers,
  getBankName,
  OpenHomeBank,
  OpenHomeBox,
  StoredBankData,
} from 'src/types/storage'
import { Err, Errorable, Ok } from 'src/types/types'
import { v4 as UuidV4 } from 'uuid'
import { Box } from './interfaces'

export class HomeBox implements Box<OHPKM> {
  id: string
  name: string | undefined
  index: number

  pokemon: Array<OHPKM | undefined> = new Array(120)

  constructor(homeBox: OpenHomeBox) {
    const { id, name, index } = homeBox

    if (name !== `Box ${index + 1}`) {
      this.name = name ?? undefined
    }

    this.id = id
    this.index = index
  }

  getIdentifierMapping(): BoxMonIdentifiers {
    const entries = this.pokemon
      .map(
        (mon, i) => [i, mon ? getHomeIdentifier(mon) : undefined] as [number, string | undefined]
      )
      .filter(([, identifier]) => !!identifier) as [number, string][]

    return Object.fromEntries(entries)
  }

  loadMonsFromIdentifiers(boxIdentifers: BoxMonIdentifiers, monLookup: OhpkmLookup) {
    this.pokemon = new Array(120)
    Object.entries(boxIdentifers).forEach(([indexStr, identifier]) => {
      const mon = monLookup(identifier)
      const index = parseInt(indexStr)

      if (!Number.isNaN(index) && mon) {
        this.pokemon[index] = mon
      } else {
        console.error()
      }
    })
  }

  firstEmptyIndex(): number | undefined {
    return this.pokemon.findIndex((value) => value === undefined)
  }

  containsMons() {
    return this.pokemon.filter(filterUndefined).length > 0
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

  constructor(storedBankData: StoredBankData, monLookup: OhpkmLookup) {
    this._banks = storedBankData.banks.map((bank) => ({
      ...bank,
      boxes: bank.boxes.map((box) => ({ ...box, last_saved_index: box.index })),
    }))
    this.setAndLoadBank(storedBankData.current_bank, monLookup)
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

  setAndLoadBank(bankIndex: number, getMonById: OhpkmLookup) {
    this._currentBankIndex = bankIndex
    this._currentBoxIndex = this._banks[bankIndex].current_box
    // console.log(this._banks, this._banks[bank_index], this._banks[bank_index].boxes)
    const bankBoxes = this._banks[bankIndex].boxes.sort((box_metadata) => box_metadata.index)

    this.boxes = bankBoxes.map((box) => new HomeBox(box))
    bankBoxes.forEach((boxMetadata) => {
      this.boxes[boxMetadata.index].loadMonsFromIdentifiers(boxMetadata.identifiers, getMonById)
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

  deleteBoxCurrentBank(boxIndex: number, boxId: string): Errorable<null> {
    const bank = this.getCurrentBank()

    if (boxIndex >= bank.boxes.length) {
      return Err(
        `Cannot access box at index ${boxIndex} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    if (this.boxes[boxIndex].containsMons()) {
      return Err('Cannot delete box; box is not empty')
    }

    if (this.boxes[boxIndex].id !== boxId) {
      return Err(`Box id and index mismatch`)
    }
    this.boxes = [...this.boxes.filter((box) => box.id !== boxId)]
    this.resetBoxIndices()
    this.syncBankToBoxes()

    return Ok(null)
  }

  addBoxCurrentBank(location: AddBoxLocation): Errorable<null> {
    const newBox = new HomeBox({
      id: UuidV4(),
      name: null,
      index: this.boxes.length,
      identifiers: {},
    })

    if (location === 'start') {
      this.boxes = [newBox, ...this.boxes]
    } else if (location === 'end') {
      this.boxes = [...this.boxes, newBox]
    } else {
      const index = location[1]
      if (index >= this.boxes.length) {
        return Err(`index ${index} is greater than box cound (${this.boxes.length})`)
      }
      const pivot = location[0] === 'before' ? index : index + 1
      this.boxes = [...this.boxes.slice(0, pivot), newBox, ...this.boxes.slice(pivot)]
    }

    this.resetBoxIndices()
    this.syncBankToBoxes()

    return Ok(null)
  }

  reorderBoxesCurrentBank(ids_in_new_order: string[]) {
    this.boxes = this.boxes.toSorted(numericSorter((box) => ids_in_new_order.indexOf(box.id)))

    this.boxes.forEach((box, newIndex) => (box.index = newIndex))

    this.syncBankToBoxes()
  }

  resetBoxIndices() {
    this.boxes.forEach((box, newIndex) => (box.index = newIndex))
    this.syncBankToBoxes()
  }

  removeDupesFromBox(boxIndex: number) {
    const alreadyPresent: Set<string> = new Set()

    for (let slot = 0; slot < HomeData.BOX_COLUMNS * HomeData.BOX_ROWS; slot++) {
      const mon = this.boxes[boxIndex].pokemon[slot]

      if (!mon) continue

      const identifier = getMonFileIdentifier(mon)

      if (!identifier) continue
      if (alreadyPresent.has(identifier)) {
        this.boxes[boxIndex].pokemon[slot] = undefined
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

  boxFirstEmptyLocation(boxIndex: number): MonLocation | undefined {
    const firstOpenIndex = this.boxes[boxIndex].firstEmptyIndex()
    if (firstOpenIndex === undefined) return undefined
    return {
      is_home: true,
      bank: this.currentBankIndex,
      box: boxIndex,
      box_slot: firstOpenIndex,
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

  clone(monLookup: OhpkmLookup) {
    const newHomeData = new HomeData({ banks: this._banks, current_bank: 0 }, monLookup)

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

export type AddBoxLocation = 'start' | 'end' | ['before', number] | ['after', number]
