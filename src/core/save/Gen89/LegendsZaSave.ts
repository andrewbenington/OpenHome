import { PA9 } from '@openhome-core/pkm'
import { Item } from '@openhome-core/resources/consts/Items'
import {
  ZA_TRANSFER_RESTRICTIONS_BASE,
  ZA_TRANSFER_RESTRICTIONS_MD,
} from '@openhome-core/resources/consts/TransferRestrictions'
import { isRestricted } from '@openhome-core/save/util/TransferRestrictions'
import { Result } from '@openhome-core/util/functional'
import { ItemTransferDatabase } from '@openhome-ui/items/types'
import {
  ConvertStrategy,
  ExtraFormIndex,
  ItemDataTs,
  LegendsZaSaveRust,
  LzaItemStorage,
  LzaVersion,
  OriginGame,
  Pa9Wasm,
} from '@pkm-rs/pkg'
import { OHPKM } from '../../pkm/OHPKM'
import { BoxAndSlot, WasmOfficialSave } from '../interfaces'
import { PathData } from '../util/path'

const BOX_SLOT_GAP_BYTES = 0x40

export class LegendsZaSave extends WasmOfficialSave<Pa9Wasm, PA9, LegendsZaSaveRust> {
  WASM_SAVE_CLASS = LegendsZaSaveRust

  static boxSizeBytes = (PA9.getBoxSize() + BOX_SLOT_GAP_BYTES) * 30
  static pkmType = PA9
  static saveTypeAbbreviation = 'ZA'
  static saveTypeName = 'Pokémon Legends Z-A'
  static saveTypeID = 'ZASAV'

  filePath: PathData
  fileCreated?: Date

  money: number = 0 // TODO: Z-A money

  invalid = false
  tooEarlyToOpen = false

  updatedBoxSlots: BoxAndSlot[] = []

  constructor(path: PathData, bytes: Uint8Array) {
    super(LegendsZaSaveRust.fromBytes(bytes))
    this.filePath = path
  }

  convertOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Result<PA9> {
    return PA9.fromOhpkm(ohpkm, strategy)
  }

  monConstructor(buffer: ArrayBuffer, encrypted: boolean): PA9 {
    return PA9.fromBytes(buffer, encrypted)
  }

  isEmptySlot(bytes: ArrayBuffer): boolean {
    return Pa9Wasm.isEmptySlot(new Uint8Array(bytes))
  }

  monFromWasm(wasmMon: Pa9Wasm): PA9 {
    return PA9.fromWasm(wasmMon)
  }

  supportsMon(nationalDex: number, formNumber: number, extraFormIndex?: ExtraFormIndex): boolean {
    switch (this.saveVersion) {
      case 'Base Game':
        return !isRestricted(ZA_TRANSFER_RESTRICTIONS_BASE, nationalDex, formNumber, extraFormIndex)
      case 'Mega Dimension':
        return !isRestricted(ZA_TRANSFER_RESTRICTIONS_MD, nationalDex, formNumber, extraFormIndex)
    }
  }

  supportsItem(itemIndex: number) {
    switch (this.saveVersion) {
      case 'Base Game':
        return itemIndex <= Item.Falinksite
      case 'Mega Dimension':
        return itemIndex <= Item.Glimmoranite
    }
  }

  get saveVersion(): LzaVersion {
    // for hack in monSupport.test.ts that calls this from the class's prototype
    try {
      return this.inner.saveVersion
    } catch {
      return 'Base Game'
    }
  }

  getDisplayData() {
    return { ...this.inner.getDisplayData() }
  }

  getItemInventory = () => this.inner.getItemInventory()

  updateItemData = (itemData: ItemDataTs) => this.inner.updateItemData(itemData)

  getItemDatabase = () => LegendsZaItemDatabase

  static fileIsSave(bytes: Uint8Array): boolean {
    return LegendsZaSaveRust.fileIsSave(bytes)
  }

  static includesOrigin(origin: OriginGame) {
    return LegendsZaSaveRust.includesOrigin(origin)
  }
}

export const LegendsZaItemDatabase: ItemTransferDatabase = {
  categoryIndexes: () => Array.from(LzaItemStorage.pouchIndexes()),
  categoryName: LzaItemStorage.pouchName,
  maxAllowed: LzaItemStorage.maxAllowed,
  availability: LzaItemStorage.availabilityOf,
  internalCategoryForItem: (index) => LzaItemStorage.pouchIndexForItem(index),
  internalCategoryToOpenhome: LzaItemStorage.pouchIndexToOpenHome,
  internalCategoryFromOpenhome: LzaItemStorage.pouchIndexFromOpenHome,
}
