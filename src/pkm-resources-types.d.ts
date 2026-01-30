import { Type } from '@openhome-core/util/types'
import '@pkm-rs/pkg'

declare module '@pkm-rs/pkg' {
  type FormeMetadata = {
    readonly type1: Type
    readonly type2?: Type
    readonly eggGroups: EggGroup[]
  }
}
