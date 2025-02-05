import { utf16BytesToString } from 'pokemon-files'
import { SCObjectBlock } from '../../../util/SwishCrypto/SCBlock'

export class MyStatusBlock {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: SCObjectBlock) {
    this.dataView = new DataView(scBlock.raw)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0x20, 24)
  }
  public getFullID(): number {
    return this.dataView.getUint32(0x10, true)
  }
  public getSID(): number {
    return this.dataView.getUint16(0x12, true)
  }
  public getGender(): boolean {
    return !!(this.dataView.getUint8(0x15) & 1)
  }
  public getLanguage(): number {
    return this.dataView.getUint8(0x17)
  }
}
