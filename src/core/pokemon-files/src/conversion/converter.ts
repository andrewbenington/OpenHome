import { MonFormat } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import {
  ConvertStrategies,
  ConvertStrategy,
  MetData,
  PkmConverter as PkmConverterWasm,
} from '@pkm-rs/pkg'
import { Stats } from '@pokemon-files/util'

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

  ivs(ohpkm: OHPKM): Stats {
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
