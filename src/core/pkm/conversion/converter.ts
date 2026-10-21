import { MonFormat, PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Stats } from '@openhome-core/util/types'
import {
  ConvertStrategies,
  ConvertStrategy,
  MetData,
  PidGenerationParametersJs,
  PidModificationStrategy,
  PkmConverter as PkmConverterWasm,
  ShinyOdds,
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

  pidModificationStrategy(shinyOdds: ShinyOdds): PidModificationStrategy {
    return {
      shiny: shinyOdds,
      nature: this.strategy.personalityValue__preserveNature,
      keep_unown_letter: this.strategy.personalityValue__preserveUnownForm,
      keep_gender: this.strategy.personalityValue__preserveGender,
    }
  }

  personalityValue(mon: PKMInterface, shinyOdds: ShinyOdds) {
    const parameters = PidGenerationParametersJs.new(
      mon.nationalDex,
      mon.formIndex,
      mon.nature,
      mon.gender,
      mon.isShiny(),
      mon.formIndex,
      mon.trainerID,
      mon.secretID
    )

    return this._inner.personalityValue(parameters, shinyOdds)
  }
}
