import { utf16BytesToString } from 'pokemon-files'
import { GameOfOrigin } from 'pokemon-resources'

export class MyStatusBlockBDSP {
  dataView: DataView<ArrayBuffer>

  constructor(saveBytes: Uint8Array) {
    this.dataView = new DataView(saveBytes.slice(0x79bb4, 0x79bb4 + 0x50).buffer)
  }

  public getName(): string {
    return utf16BytesToString(this.dataView.buffer, 0, 24)
  }
  public getFullID(): number {
    return this.dataView.getUint32(0x1c, true)
  }
  public getSID(): number {
    return this.dataView.getUint16(0x1e, true)
  }
  public getGender(): boolean {
    return !(this.dataView.getUint8(0x24) & 1)
  }
  public getGame(): GameOfOrigin {
    const origin = this.dataView.getUint8(0x2b)

    return origin === 0
      ? GameOfOrigin.BrilliantDiamond
      : origin === 1
        ? GameOfOrigin.ShiningPearl
        : GameOfOrigin.INVALID_0
  }
}
