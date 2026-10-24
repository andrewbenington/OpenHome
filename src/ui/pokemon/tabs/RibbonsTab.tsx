import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { ModernRibbons } from '@openhome-core/resources'
import { Gen9Ribbons } from '@openhome-core/resources/consts/Ribbons'
import { R } from '@openhome-core/util/functional'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { getPublicImageURL } from '@openhome-ui/images/images'
import { getRibbonSpritePath } from '@openhome-ui/images/ribbons'
import { IdentifierNotPresentError, useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { Spinner, Tooltip } from '@radix-ui/themes'
import { useState } from 'react'
import './RibbonsTab.css'

const RibbonsDisplay = (props: { mon: PKMInterface }) => {
  const ohpkmStore = useOhpkmStore()
  const displayError = useDisplayError()
  const { mon } = props

  if (!mon.ribbons || mon.ribbons.length === 0) {
    return <div className="no-ribbons-message">This Pokémon has no ribbons.</div>
  }

  function showAffixError(ribbon: string, error: string) {
    displayError(`Error affixing ${formatRibbon(ribbon)}`, error)
  }

  return (
    <div className="ribbons-container pokemon-modal-content">
      {mon.ribbons?.map((ribbon) => {
        const ribbonDisplay = formatRibbon(ribbon)

        return (
          <RibbonButton
            key={ribbonDisplay}
            ribbon={ribbon}
            isAffixed={
              mon.affixedRibbon !== undefined && Gen9Ribbons.indexOf(ribbon) === mon.affixedRibbon
            }
            onAffix={async () => {
              if (mon instanceof OHPKM) {
                const ribbonIndex = ModernRibbons.indexOf(ribbon)

                const showIdMissingError = (error: IdentifierNotPresentError) =>
                  showAffixError(
                    ribbon,
                    `Could not find Pokémon with identifier ${error.identifier}`
                  )

                if (ribbonIndex !== -1) {
                  await ohpkmStore
                    .updateMonAffixedRibbon(
                      mon.openhomeId,
                      mon.affixedRibbon === ribbonIndex ? undefined : ribbonIndex
                    )
                    .then(R.mapErr(showIdMissingError))
                }
              }
            }}
            onAffixError={(error) => showAffixError(ribbon, error)}
          />
        )
      })}
    </div>
  )
}

type RibbonProps = {
  ribbon: string
  isAffixed: boolean
  onAffix: () => Promise<void>
  onAffixError: (error: string) => void
}

function RibbonButton(props: RibbonProps) {
  const ribbonDisplay = formatRibbon(props.ribbon)
  const [loading, setLoading] = useState(false)

  return (
    <Tooltip content={ribbonDisplay} side="bottom">
      <div style={{ position: 'relative' }}>
        <img
          className={props.isAffixed ? 'affixed-ribbon' : 'ribbon'}
          draggable={false}
          key={ribbonDisplay}
          alt={ribbonDisplay}
          src={getRibbonImage(props.ribbon)}
          onDoubleClick={() => {
            setLoading(true)
            props
              .onAffix()
              .catch(props.onAffixError)
              .finally(() => setLoading(false))
          }}
          style={{ filter: loading ? 'brightness(60%)' : undefined }}
        />
        {loading && (
          <div className="loading-backdrop">
            <Spinner />
          </div>
        )}
      </div>
    </Tooltip>
  )
}

function formatRibbon(ribbon: string, contestMemoryCount?: number, battleMemoryCount?: number) {
  if (ribbon.endsWith('Mark')) {
    return ribbon
  }
  if (ribbon.includes(' (')) {
    const [contestRibbon, region] = ribbon.split(' (')

    return `${contestRibbon} Ribbon (${region}`
  }
  if (ribbon === 'Contest Memory') {
    return `${ribbon} Ribbon (${contestMemoryCount})`
  }
  if (ribbon === 'Battle Memory') {
    return `${ribbon} Ribbon (${battleMemoryCount})`
  }
  return `${ribbon} Ribbon`
}

function getRibbonImage(ribbon: string, contestMemoryCount?: number, battleMemoryCount?: number) {
  if (ribbon === 'Contest Memory' && contestMemoryCount === 40) {
    return getPublicImageURL(getRibbonSpritePath('Contest Memory Gold'))
  }
  if (ribbon === 'Battle Memory' && battleMemoryCount === 6) {
    return getPublicImageURL(getRibbonSpritePath('battle Memory Gold'))
  }
  return getPublicImageURL(getRibbonSpritePath(ribbon))
}

export default RibbonsDisplay
