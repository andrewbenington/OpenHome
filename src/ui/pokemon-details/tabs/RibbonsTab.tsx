import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { ModernRibbons } from '@openhome-core/resources'
import { Gen9Ribbons } from '@openhome-core/resources/consts/Ribbons'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getRibbonSpritePath } from '@openhome-ui/images/ribbons'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { Tooltip } from '@radix-ui/themes'
import './RibbonsTab.css'

const RibbonsDisplay = (props: { mon: PKMInterface }) => {
  const ohpkmStore = useOhpkmStore()
  const { mon } = props

  if (!mon.ribbons || mon.ribbons.length === 0) {
    return <div className="no-ribbons-message">This Pokémon has no ribbons.</div>
  }

  const formatRibbon = (ribbon: string) => {
    if (ribbon.endsWith('Mark')) {
      return ribbon
    }
    if (ribbon.includes(' (')) {
      const [contestRibbon, region] = ribbon.split(' (')

      return `${contestRibbon} Ribbon (${region}`
    }
    if (ribbon === 'Contest Memory') {
      return `${ribbon} Ribbon (${mon.contestMemoryCount})`
    }
    if (ribbon === 'Battle Memory') {
      return `${ribbon} Ribbon (${mon.battleMemoryCount})`
    }
    return `${ribbon} Ribbon`
  }

  const getRibbonImage = (ribbon: string) => {
    if (ribbon === 'Contest Memory' && mon.contestMemoryCount === 40) {
      return getPublicImageURL(getRibbonSpritePath('Contest Memory Gold'))
    }
    if (ribbon === 'Battle Memory' && mon.contestMemoryCount === 6) {
      return getPublicImageURL(getRibbonSpritePath('battle Memory Gold'))
    }
    return getPublicImageURL(getRibbonSpritePath(ribbon))
  }

  return (
    <div className="ribbons-container pokemon-modal-content">
      {mon.ribbons?.map((ribbon) => {
        const ribbonDisplay = formatRibbon(ribbon)

        return (
          <Tooltip key={`ribbon_${ribbon}`} content={ribbonDisplay} side="bottom">
            <img
              className={
                mon.affixedRibbon && Gen9Ribbons.indexOf(ribbon) === mon.affixedRibbon
                  ? 'affixed-ribbon'
                  : 'ribbon'
              }
              draggable={false}
              key={ribbonDisplay}
              alt={ribbonDisplay}
              src={getRibbonImage(ribbon)}
              onDoubleClick={() => {
                if (mon instanceof OHPKM) {
                  const ribbonIndex = ModernRibbons.indexOf(ribbon)
                  if (ribbonIndex !== -1) {
                    ohpkmStore.updateMonAffixedRibbon(
                      mon.openhomeId,
                      mon.affixedRibbon === ribbonIndex ? undefined : ribbonIndex
                    )
                  }
                }
              }}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}

export default RibbonsDisplay
