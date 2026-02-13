import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import {
  BoxMonIdentifiers,
  SimpleOpenHomeBank,
  SimpleOpenHomeBox,
  StoredBankData,
} from '@openhome-core/save/util/storage'
import { TransferRestrictions } from '@openhome-core/save/util/TransferRestrictions'
import { Option, range, Result } from '@openhome-core/util/functional'
import { filterUndefined, numericSorter } from '@openhome-core/util/sort'
import { MonLocation } from '@openhome-ui/state/saves/reducer'
import { v4 as UuidV4 } from 'uuid'
import { R } from '../util/functional'
import { BoxAndSlot } from './interfaces'

const BOX_ROWS = 10
const BOX_COLUMNS = 12
const SLOTS_PER_BOX = BOX_ROWS * BOX_COLUMNS

export class OpenHomeBanks {
  static BOX_ROWS = BOX_ROWS
  static BOX_COLUMNS = BOX_COLUMNS
  static SLOTS_PER_BOX = SLOTS_PER_BOX

  boxRows = OpenHomeBanks.BOX_ROWS
  boxColumns = OpenHomeBanks.BOX_COLUMNS

  transferRestrictions: TransferRestrictions = {}

  private _currentBoxIndex: number = 0
  private _currentBankIndex: number = 0
  private _banks: OpenHomeBank[]

  bytes: Uint8Array = new Uint8Array()

  invalid: boolean = false
  tooEarlyToOpen: boolean = false

  updatedBoxSlots: BankBoxCoordinates[] = []

  private constructor(banks: OpenHomeBank[], currentBankIndex: number) {
    this._banks = banks
    this.setAndLoadBank(currentBankIndex)
  }

  static fromStored(storedBankData: StoredBankData) {
    return new OpenHomeBanks(
      storedBankData.banks.map(OpenHomeBank.fromSimpleBank),
      storedBankData.current_bank
    )
  }

  pluginIdentifier?: string | undefined
  pcChecksumOffset?: number | undefined
  pcOffset?: number | undefined
  calculatePcChecksum?: (() => number) | undefined

  getCurrentBox() {
    return this.getCurrentBank().getCurrentBox()
  }

  getCurrentBank() {
    return this._banks[this._currentBankIndex]
  }

  getCurrentBankName() {
    return this.getCurrentBank().nameOrDefault()
  }

  gameColor() {
    return '#7DCEAB'
  }

  addBank(name: string | undefined, box_count: number) {
    const newBank: SimpleOpenHomeBank = {
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

    this._banks.push(OpenHomeBank.fromSimpleBank(newBank))
    return newBank
  }

  setAndLoadBank(bankIndex: number) {
    this._currentBankIndex = bankIndex
    this._currentBoxIndex = this._banks[bankIndex].currentBoxIndex
  }

  getAtLocation(location: BankBoxCoordinates): Option<OhpkmIdentifier> {
    if (location.bank >= this._banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this._banks.length} banks total)`
      )
    }

    return this._banks[location.bank].getAtLocation(location.box, location.boxSlot)
  }

  setAtLocation(location: BankBoxCoordinates, identifier: OhpkmIdentifier | undefined) {
    if (location.boxSlot >= OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.boxSlot} exceeds box size (${OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS}))`
      )
    }

    if (location.bank >= this._banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this._banks.length} banks total)`
      )
    }

    const bankToUpdate = this._banks[location.bank]

    if (location.box >= bankToUpdate.boxCount()) {
      throw new Error(
        `Cannot access box at index ${location.box} (${bankToUpdate.name} has ${bankToUpdate.boxCount()} boxes total)`
      )
    }

    this.updatedBoxSlots.push(location)
    this._banks[location.bank].setAtLocation(location.box, location.boxSlot, identifier)
  }

  clearAtLocation(location: BankBoxCoordinates) {
    this.setAtLocation(location, undefined)
  }

  setBoxNameCurrentBank(boxIndex: number, name: string | undefined): Result<null, string> {
    return this.getCurrentBank().setBoxName(boxIndex, name)
  }

  deleteBoxCurrentBank(boxIndex: number, boxId: string): Result<null, string> {
    return this.getCurrentBank().deleteBox(boxIndex, boxId)
  }

  addBoxCurrentBank(
    location: AddBoxLocation,
    boxName?: string,
    identifiers?: BoxMonIdentifiers
  ): Result<null, string> {
    return this.getCurrentBank().addBox(location, boxName, identifiers)
  }

  reorderBoxesCurrentBank(idsInNewOrder: string[]) {
    this.getCurrentBank().reorderBoxes(idsInNewOrder)
  }

  resetBoxIndices() {
    this.getCurrentBank().resetBoxIndices()
  }

  removeDupesFromBox(boxIndex: number) {
    this.getCurrentBank().removeDupesFromBox(boxIndex)
  }

  setBankName(bank_index: number, name: string | undefined): Result<null, string> {
    if (this._banks.length <= bank_index) {
      return R.Err(`Cannot access bank at index ${bank_index} (${this._banks.length} banks total)`)
    }

    this._banks[bank_index].name = name

    return R.Ok(null)
  }

  slotIsEmpty(location: BankBoxCoordinates): boolean {
    if (location.boxSlot >= OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS) {
      throw new Error(
        `Box slot ${location.boxSlot} exceeds box size (${OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS}))`
      )
    }

    if (location.bank >= this._banks.length) {
      throw new Error(
        `Cannot access bank at index ${location.bank} (${this._banks.length} banks total)`
      )
    }

    const bank = this._banks[location.bank]

    if (location.box >= bank.boxCount()) {
      throw new Error(
        `Cannot access box at index ${location.box} (${bank.name} has ${bank.boxCount()} boxes total)`
      )
    }

    return !bank.getAtLocation(location.box, location.boxSlot)
  }

  displayState() {
    return {
      currentBox: this._currentBoxIndex,
      _currentBankIndex: this._currentBankIndex,
      updatedBoxSlots: this.updatedBoxSlots,
      currentBank: this.getCurrentBank(),
      boxCount: this.getCurrentBank().boxCount(),
    }
  }

  firstEmptyBoxSlotCurrentBank(boxIndex: number): MonLocation | undefined {
    const firstOpenIndex = this.getCurrentBank().firstEmptySlotInBox(boxIndex)
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
    if (index >= this.getCurrentBank().boxCount()) {
      throw new Error(
        `Cannot access box at index ${index} (${this.getCurrentBankName()} has ${this.getCurrentBank().boxCount()} boxes total)`
      )
    }
    this._currentBoxIndex = index
    this._banks[this._currentBankIndex].currentBoxIndex = index
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

  getCurrentBankBoxes(): ReadonlyArray<Readonly<OpenHomeBox>> {
    return this.getCurrentBank().getBoxes()
  }

  public get currentPCBox() {
    return this._currentBoxIndex
  }

  clone() {
    const newHomeData = new OpenHomeBanks(this._banks, this.currentBankIndex)

    newHomeData._currentBoxIndex = this._currentBoxIndex
    newHomeData._banks = [...this._banks]
    newHomeData.updatedBoxSlots = this.updatedBoxSlots

    return newHomeData
  }

  findIfPresent(identifier: OhpkmIdentifier): Option<BankBoxCoordinates> {
    for (const bank of this.banks) {
      const location = bank.locationOf(identifier)
      if (location) {
        return { ...location, bank: bank.index }
      }
    }
  }
}

type BoxIndex = number

export class OpenHomeBank {
  id: string
  index: number
  name: Option<string>
  private _boxes: OpenHomeBox[]
  currentBoxIndex: number

  // Maps a mon's identifier to its current box index. Modifications to this._boxes (via setAtLocation()) should always keep this up to date
  private _reverseLookup: Map<OhpkmIdentifier, BoxIndex> = new Map()

  private constructor(simpleBank: SimpleOpenHomeBank) {
    this.id = simpleBank.id
    this.index = simpleBank.index
    this.name = simpleBank.name
    this.currentBoxIndex = simpleBank.current_box
    this._boxes = simpleBank.boxes
      .toSorted(numericSorter((box) => box.index))
      .map(OpenHomeBox.fromSimpleBox)

    for (const box of this._boxes) {
      box.allContainedMons().forEach((identifier) => this._reverseLookup.set(identifier, box.index))
    }
  }

  static fromSimpleBank(simpleBank: SimpleOpenHomeBank): OpenHomeBank {
    return new OpenHomeBank(simpleBank)
  }

  nameOrDefault() {
    return this.name ?? `Bank ${this.index + 1}`
  }

  toSimple(): SimpleOpenHomeBank {
    return {
      id: this.id,
      index: this.index,
      name: this.name,
      boxes: this._boxes.map((box) => box.toSimple()),
      current_box: this.currentBoxIndex,
    }
  }

  getCurrentBox() {
    return this._boxes[this.currentBoxIndex]
  }

  getAtLocation(box: number, boxSlot: number): Option<OhpkmIdentifier> {
    if (box >= this.boxCount()) {
      throw new Error(
        `Cannot access box at index ${box} (${this.nameOrDefault()} has ${this.boxCount()} boxes total)`
      )
    }

    return this._boxes[box].getSlot(boxSlot)
  }

  setAtLocation(boxIndex: number, boxSlot: number, contents: Option<OhpkmIdentifier>) {
    if (boxIndex >= this.boxCount()) {
      throw new Error(
        `Cannot access box at index ${boxIndex} (${this.nameOrDefault()} has ${this.boxCount()} boxes total)`
      )
    }
    const box = this._boxes[boxIndex]

    const previousContents = box.getSlot(boxSlot)
    if (previousContents) {
      this._reverseLookup.delete(previousContents)
    }

    this._boxes[boxIndex].setSlot(boxSlot, contents)
    if (contents) {
      this._reverseLookup.set(contents, boxIndex)
    }
  }

  allContainedMons(): OhpkmIdentifier[] {
    return this._boxes.flatMap((box) => box.allContainedMons())
  }

  locationOf(identifier: OhpkmIdentifier): Option<BoxAndSlot> {
    const boxIndex = this._reverseLookup.get(identifier)
    if (boxIndex !== undefined) {
      const boxSlot = this._boxes[boxIndex].locationOf(identifier)
      if (boxSlot !== undefined) {
        return { box: boxIndex, boxSlot }
      }
    }
  }

  boxCount() {
    return this._boxes.length
  }

  deleteBox(boxIndex: number, boxId: string): Result<null, string> {
    if (boxIndex >= this.boxCount()) {
      return R.Err(
        `Cannot access box at index ${boxIndex} (${this.name} has ${this.boxCount()} boxes total)`
      )
    }

    const box = this._boxes[boxIndex]

    if (box.containsMons()) {
      return R.Err('Cannot delete box; box is not empty')
    }

    if (box.id !== boxId) {
      return R.Err(`Box id and index mismatch`)
    }

    this._boxes = [...this._boxes.filter((box) => box.id !== boxId)]

    return R.Ok(null)
  }

  addBox(
    location: AddBoxLocation,
    boxName?: string,
    identifiers?: BoxMonIdentifiers
  ): Result<null, string> {
    const newBox = OpenHomeBox.fromSimpleBox({
      id: UuidV4(),
      name: boxName ?? null,
      index: this.boxCount(),
      identifiers: identifiers ?? new Map(),
    })

    if (location === 'start') {
      this._boxes = [newBox, ...this._boxes]
    } else if (location === 'end') {
      this._boxes = [...this._boxes, newBox]
    } else {
      const index = location[1]
      if (index >= this.boxCount()) {
        return R.Err(`index ${index} is greater than box cound (${this.boxCount()})`)
      }
      const pivot = location[0] === 'before' ? index : index + 1
      this._boxes = [...this._boxes.slice(0, pivot), newBox, ...this._boxes.slice(pivot)]
    }

    this.resetBoxIndices()

    return R.Ok(null)
  }

  reorderBoxes(ids_in_new_order: string[]) {
    this._boxes = this._boxes.toSorted(numericSorter((box) => ids_in_new_order.indexOf(box.id)))
    this._boxes.forEach((box, newIndex) => (box.index = newIndex))
  }

  resetBoxIndices() {
    this._boxes.forEach((box, newIndex) => (box.index = newIndex))
  }

  setBoxName(box_index: number, name: Option<string>): Result<null, string> {
    if (box_index >= this.boxCount()) {
      return R.Err(
        `Cannot access box at index ${box_index} (${this.name} has ${this.boxCount()} boxes total)`
      )
    }

    this._boxes[box_index].name = name || undefined

    return R.Ok(null)
  }

  firstEmptySlotInBox(boxIndex: number): Option<number> {
    return this._boxes[boxIndex].firstEmptyIndex()
  }

  removeDupesFromBox(boxIndex: number) {
    const alreadyPresent: Set<string> = new Set()

    for (let slot = 0; slot < OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS; slot++) {
      const identifier = this._boxes[boxIndex].getSlot(slot)

      if (!identifier) continue
      if (alreadyPresent.has(identifier)) {
        this._boxes[boxIndex].clearSlot(slot)
      } else {
        alreadyPresent.add(identifier)
      }
    }

    this._boxes = [...this._boxes]
  }

  getBoxes(): ReadonlyArray<Readonly<OpenHomeBox>> {
    return [...this._boxes]
  }

  indexOfBoxId(id: string): Option<number> {
    return this._boxes.findIndex((box) => box.id === id)
  }
}

export class OpenHomeBox {
  id: string
  name: Option<string>
  index: number

  private _boxSlots: Array<Option<OhpkmIdentifier>> = new Array(SLOTS_PER_BOX)

  // Maps a mon's identifier to its slot index. Modifications to this._boxSlots should always keep this up to date.
  // This lookup saves a lot of computation and avoids slowdown when viewing all mons and their locations.
  private _reverseLookup: Map<OhpkmIdentifier, number> = new Map()

  getSlot(boxSlot: number): Option<OhpkmIdentifier> {
    if (boxSlot > this._boxSlots.length) {
      throw new Error(
        `Cannot access box slot index ${boxSlot} (${this.nameOrDefault()} has ${this._boxSlots.length} slots total)`
      )
    }

    return this._boxSlots[boxSlot]
  }

  slotIsEmpty(boxSlot: number): boolean {
    return this.getSlot(boxSlot) === undefined
  }

  setSlot(boxSlot: number, contents: Option<OhpkmIdentifier>) {
    const previousContents = this.getSlot(boxSlot)
    if (previousContents) {
      this._reverseLookup.delete(previousContents)
    }

    this._boxSlots[boxSlot] = contents
    if (contents) {
      this._reverseLookup.set(contents, boxSlot)
    }
  }

  clearSlot(index: number) {
    this.setSlot(index, undefined)
  }

  private constructor(
    name: Option<string>,
    index: number,
    identifiers?: BoxMonIdentifiers,
    id?: string
  ) {
    this.id = id ?? UuidV4()
    this.name = name
    this.index = index

    if (identifiers) {
      for (const [index, identifier] of identifiers) {
        this.setSlot(index, identifier)
      }
    }
  }

  static fromSimpleBox(homeBox: SimpleOpenHomeBox) {
    let name = homeBox.name ?? undefined
    if (name === `Box ${homeBox.index + 1}`) {
      name = undefined
    }

    return new OpenHomeBox(name, homeBox.index, homeBox.identifiers)
  }

  static create(index: number, name?: string, identifiers?: BoxMonIdentifiers): OpenHomeBox {
    return new OpenHomeBox(name, index, identifiers)
  }

  getIdentifierMapping(): Map<number, OhpkmIdentifier> {
    const entries = this._boxSlots
      .map((identifier, i) => [i, identifier] as [number, OhpkmIdentifier | undefined])
      .filter(([, identifier]) => !!identifier) as [number, OhpkmIdentifier][]

    return new Map(entries)
  }

  loadSlots(boxIdentifers: BoxMonIdentifiers) {
    this._boxSlots = new Array(SLOTS_PER_BOX)
    for (const [index, identifier] of boxIdentifers) {
      this.setSlot(index, identifier)
    }
  }

  slotCount() {
    return this._boxSlots.length
  }

  firstEmptyIndex(): number | undefined {
    return this._boxSlots.findIndex((value) => value === undefined)
  }

  containsMons() {
    return this._boxSlots.some((contents) => contents !== undefined)
  }

  allContainedMons(): OhpkmIdentifier[] {
    return this._boxSlots.filter(filterUndefined)
  }

  nameOrDefault() {
    return this.name ?? `Box ${this.index + 1}`
  }

  toSimple(): SimpleOpenHomeBox {
    return {
      id: this.id,
      index: this.index,
      identifiers: this.getIdentifierMapping(),
      name: this.name ?? null,
    }
  }

  locationOf(identifier: OhpkmIdentifier): Option<number> {
    return this._reverseLookup.get(identifier)
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
