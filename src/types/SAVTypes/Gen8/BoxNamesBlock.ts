import { utf16BytesToString } from 'pokemon-files'
import { SCArrayBlock } from '../../../util/SwishCrypto/SCBlock'

const BOX_COUNT = 32
const BOX_NAME_LENGTH = 0x22

export class BoxNamesBlock {
  dataView: DataView<ArrayBuffer>

  constructor(scBlock: SCArrayBlock) {
    this.dataView = new DataView(scBlock.raw)
  }

  public getBoxName(index: number): string {
    if (index >= BOX_COUNT) {
      throw Error('Attempting to get box name at index past BOX_COUNT')
    }
    return utf16BytesToString(this.dataView.buffer, index * BOX_NAME_LENGTH, BOX_NAME_LENGTH)
  }
}
