import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import {
  BoxMonIdentifiers,
  getBankName,
  OpenHomeBank,
  OpenHomeBox,
  StoredBankData,
} from '@openhome-core/save/util/storage'
import { TransferRestrictions } from '@openhome-core/save/util/TransferRestrictions'
import { range, Result } from '@openhome-core/util/functional'
import { filterUndefined, numericSorter } from '@openhome-core/util/sort'
import { MonLocation } from '@openhome-ui/state/saves/reducer'
import { v4 as UuidV4 } from 'uuid'
import { R } from '../util/functional'

export class HomeBox {
  id: string
  name: string | undefined
  index: number

  boxSlots: Array<OhpkmIdentifier | undefined> = new Array(120)

  constructor(homeBox: OpenHomeBox) {
    const { id, name, index } = homeBox

    if (name !== `Box ${index + 1}`) {
      this.name = name ?? undefined
    }

    this.id = id
    this.index = index
    for (const [index, identifier] of homeBox.identifiers) {
      this.boxSlots[index] = identifier
    }
  }

  getIdentifierMapping(): Map<number, OhpkmIdentifier> {
    const entries = this.boxSlots
      .map((identifier, i) => [i, identifier] as [number, OhpkmIdentifier | undefined])
      .filter(([, identifier]) => !!identifier) as [number, OhpkmIdentifier][]

    return new Map(entries)
  }

  loadSlots(boxIdentifers: BoxMonIdentifiers) {
    this.boxSlots = new Array(120)
    for (const [index, identifier] of boxIdentifers) {
      this.boxSlots[index] = identifier
    }
  }

  firstEmptyIndex(): number | undefined {
    return this.boxSlots.findIndex((value) => value === undefined)
  }

  containsMons() {
    return this.boxSlots.filter(filterUndefined).length > 0
  }

  nameOrDefault() {
    return this.name ?? `Box ${this.index + 1}`
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

  constructor(storedBankData: StoredBankData) {
    this._banks = storedBankData.banks.map((bank) => ({
      ...bank,
      boxes: bank.boxes.map((box) => ({ ...box, last_saved_index: box.index })),
    }))
    this.setAndLoadBank(storedBankData.current_bank)
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
        identifiers: new Map(),
      })),
      current_box: 0,
    }

    this._banks.push(newBank)
    return newBank
  }

  setAndLoadBank(bankIndex: number) {
    this._currentBankIndex = bankIndex
    this._currentBoxIndex = this._banks[bankIndex].current_box
    // console.log(this._banks, this._banks[bank_index], this._banks[bank_index].boxes)
    const bankBoxes = this._banks[bankIndex].boxes.sort((box_metadata) => box_metadata.index)

    this.boxes = bankBoxes.map((box) => new HomeBox(box))
    bankBoxes.forEach((boxMetadata) => {
      this.boxes[boxMetadata.index].loadSlots(boxMetadata.identifiers)
    })
  }

  setPokemon(location: BankBoxCoordinates, identifier: OhpkmIdentifier | undefined) {
    if (location.boxSlot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.boxSlot} exceeds box size (${HomeData.BOX_COLUMNS * HomeData.BOX_ROWS}))`
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

    this.updatedBoxSlots.push(location)
    if (identifier) {
      this._banks[location.bank].boxes[location.box].identifiers.set(location.boxSlot, identifier)
      this.boxes[location.box].boxSlots[location.boxSlot] = identifier
    } else {
      this._banks[location.bank].boxes[location.box].identifiers.delete(location.boxSlot)
      if (location.bank === this._currentBankIndex) {
        this.boxes[location.box].boxSlots[location.boxSlot] = undefined
      }
    }
  }

  setBoxNameCurrentBank(box_index: number, name: string | undefined): Result<null, string> {
    const bank = this.getCurrentBank()

    if (box_index >= bank.boxes.length) {
      return R.Err(
        `Cannot access box at index ${box_index} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    this.boxes[box_index].name = name || undefined
    this.boxes = [...this.boxes]
    this.syncBankToBoxes()

    return R.Ok(null)
  }

  deleteBoxCurrentBank(boxIndex: number, boxId: string): Result<null, string> {
    const bank = this.getCurrentBank()

    if (boxIndex >= bank.boxes.length) {
      return R.Err(
        `Cannot access box at index ${boxIndex} (${bank.name} has ${bank.boxes.length} boxes total)`
      )
    }

    if (this.boxes[boxIndex].containsMons()) {
      return R.Err('Cannot delete box; box is not empty')
    }

    if (this.boxes[boxIndex].id !== boxId) {
      return R.Err(`Box id and index mismatch`)
    }
    this.boxes = [...this.boxes.filter((box) => box.id !== boxId)]
    this.resetBoxIndices()
    this.syncBankToBoxes()

    return R.Ok(null)
  }

  addBoxCurrentBank(location: AddBoxLocation): Result<null, string> {
    const newBox = new HomeBox({
      id: UuidV4(),
      name: null,
      index: this.boxes.length,
      identifiers: new Map(),
    })

    if (location === 'start') {
      this.boxes = [newBox, ...this.boxes]
    } else if (location === 'end') {
      this.boxes = [...this.boxes, newBox]
    } else {
      const index = location[1]
      if (index >= this.boxes.length) {
        return R.Err(`index ${index} is greater than box cound (${this.boxes.length})`)
      }
      const pivot = location[0] === 'before' ? index : index + 1
      this.boxes = [...this.boxes.slice(0, pivot), newBox, ...this.boxes.slice(pivot)]
    }

    this.resetBoxIndices()
    this.syncBankToBoxes()

    return R.Ok(null)
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
      const identifier = this.boxes[boxIndex].boxSlots[slot]

      if (!identifier) continue
      if (alreadyPresent.has(identifier)) {
        this.boxes[boxIndex].boxSlots[slot] = undefined
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

  setBankName(bank_index: number, name: string | undefined): Result<null, string> {
    if (this._banks.length <= bank_index) {
      return R.Err(`Cannot access bank at index ${bank_index} (${this._banks.length} banks total)`)
    }

    this._banks[bank_index].name = name

    return R.Ok(null)
  }

  slotIsEmpty(location: BankBoxCoordinates): boolean {
    if (location.boxSlot >= HomeData.BOX_COLUMNS * HomeData.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.boxSlot} exceeds box size (${HomeData.BOX_COLUMNS * HomeData.BOX_ROWS}))`
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

    return !bank.boxes[location.box].identifiers.has(location.boxSlot)
  }

  displayState() {
    return {
      currentBox: this._currentBoxIndex,
      _currentBankIndex: this._currentBankIndex,
      updatedBoxSlots: this.updatedBoxSlots,
      currentBank: this.getCurrentBank(),
      boxCount: this.boxes.length,
    }
  }

  boxFirstEmptyLocation(boxIndex: number): MonLocation | undefined {
    const firstOpenIndex = this.boxes[boxIndex].firstEmptyIndex()
    if (firstOpenIndex === undefined) return undefined
    return {
      isHome: true,
      bank: this.currentBankIndex,
      box: boxIndex,
      boxSlot: firstOpenIndex,
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
    const newHomeData = new HomeData({ banks: this._banks, current_bank: 0 })

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
  boxSlot: number
}

export function bankBoxCoordinates(bank: number, box: number, boxSlot: number): BankBoxCoordinates {
  return { bank, box, boxSlot }
}

export type AddBoxLocation = 'start' | 'end' | ['before', number] | ['after', number]
