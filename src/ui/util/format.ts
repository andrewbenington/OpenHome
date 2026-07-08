import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { RibbonTitles } from '@openhome-core/resources'
import { ModernRibbon } from '@pkm-rs/pkg/pkm_rs'

export function formatTitleAndNickname(mon: PKMInterface) {
  return mon.affixedRibbon
    ? mon.affixedRibbon === ModernRibbon.Partner
      ? `${mon.trainerName}'s ${mon.nickname}`
      : `${mon.nickname} ${RibbonTitles[mon.affixedRibbon]}`
    : mon.nickname
}
