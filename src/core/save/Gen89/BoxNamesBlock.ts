import { utf16BytesToString } from '@openhome-core/util/stringConversion'
import { ArrayBlock } from '../encryption/SwishCrypto/SwishCrypto'

const BOX_COUNT = 32
const BOX_NAME_LENGTH = 0x22

export class BoxNamesBlock {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: ArrayBlock) {
    this.dataView = new DataView(scBlock.data.Array.bytes.buffer)
  }

  public getBoxName(index: number): string {
    if (index >= BOX_COUNT) {
      throw Error('Attempting to get box name at index past BOX_COUNT')
    }
    return utf16BytesToString(this.dataView.buffer, index * BOX_NAME_LENGTH, BOX_NAME_LENGTH)
  }
}
