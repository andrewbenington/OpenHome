import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { EmptyTracker, MaybeTracked } from '../../../tracker'

export function dummyTrack<P extends PKMInterface>(mon: P): MaybeTracked<P> {
  return EmptyTracker().wrapWithIdentifier(mon, undefined)
}
