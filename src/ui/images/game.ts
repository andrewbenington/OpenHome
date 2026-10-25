import { OriginGameWithData } from '@pkm-rs/pkg'

export function getOriginIconPath(origin: OriginGameWithData) {
  return `/origin_marks/${origin.mark}.png`
}
