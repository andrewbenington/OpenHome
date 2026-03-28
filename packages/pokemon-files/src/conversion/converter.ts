import { MonFormat } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import {
  ConvertStrategies,
  ConvertStrategy,
  MetData,
  PkmConverter as PkmConverterWasm,
  Stats8,
} from '@pkm-rs/pkg'

export class PkmConverter {
  format: MonFormat
  strategy: ConvertStrategy
  _inner: PkmConverterWasm

  constructor(format: MonFormat, strategy?: ConvertStrategy) {
    this.format = format
    this.strategy = strategy ?? ConvertStrategies.getDefault()
    this._inner = new PkmConverterWasm(format, this.strategy)
  }

  nickname(ohpkm: OHPKM): string {
    return this._inner.nickname(ohpkm)
  }

  ivs(ohpkm: OHPKM): Stats8 {
    return this._inner.ivs(ohpkm)
  }

  metData(ohpkm: OHPKM): MetData {
    return this._inner.metData(ohpkm)
  }

  metLocationIndexDiamondPearl(ohpkm: OHPKM): number {
    return this._inner.metLocationIndexDiamondPearl(ohpkm)
  }

  metLocationIndexPlatinumHgss(ohpkm: OHPKM): number {
    return this._inner.metLocationIndexPlatinumHgss(ohpkm)
  }
}

const DP_FARAWAY_PLACE = 0xbba

function validDPLocation(index: number): boolean {
  return index >= 0x0070 && index < 2000
}
