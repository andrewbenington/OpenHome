import { Type } from '@openhome-core/util/types'
import '@pkm-rs/pkg'

declare module '@pkm-rs/pkg' {
  type FormeMetadata = {
    readonly type1: Type
    readonly type2?: Type
    readonly eggGroups: EggGroup[]
  }

  namespace MetadataSources {
    function supportedGameOrigins(national_dex: number, form_index: number): OriginGame[]
  }

  function allMetadataSources(): MetadataSource[]
}
