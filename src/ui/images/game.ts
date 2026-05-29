import { Generation, OriginGame, OriginGameWithData } from '@pkm-rs/pkg'

export function getOriginIconPath(origin: OriginGameWithData) {
  return origin.generation === Generation.G4 || origin.generation === Generation.G5
    ? '/icons/ds.png'
    : origin.game === OriginGame.ColosseumXd
      ? '/icons/gcn.png'
      : origin.generation === Generation.G3
        ? '/icons/gba.png'
        : origin.mark
          ? `/origin_marks/${origin.mark}.png`
          : undefined
}
