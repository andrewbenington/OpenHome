import '@pkm-rs/pkg'
import { Type } from './types/types'

declare module '@pkm-rs/pkg' {
  type FormeMetadata = {
    readonly type1: Type
    readonly type2?: Type
    readonly eggGroups: EggGroup[]
  }
}
