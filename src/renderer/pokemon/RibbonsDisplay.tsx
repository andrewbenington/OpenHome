import { Tooltip } from '@mui/material'
import { Styles } from '../../types/types'
import { Gen9Ribbons } from '../../consts/Ribbons'
import { PKM } from '../../types/PKMTypes/PKM'
import { getRibbonSpritePath } from '../images/ribbons'
import { getPublicImageURL } from '../images/images'

const styles = {
  container: {
    display: 'flex',
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ribbon: {
    width: 50,
    height: 50,
    borderWidth: 2,
    imageRendering: 'pixelated',
  },
  noRibbonsMessage: {
    width: '100%',
    height: '100%',
    display: 'grid',
    alignItems: 'center',
    textAlign: 'center',
  },
  affixedRibbon: {
    width: 50,
    height: 50,
    imageRendering: 'pixelated',
    backgroundColor: '#fff6',
    borderRadius: 5,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'white',
  },
} as Styles

const RibbonsDisplay = (props: { mon: PKM }) => {
  const { mon } = props

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

  return mon.ribbons.length === 0 ? (
    <div style={styles.noRibbonsMessage}>This Pokémon has no ribbons.</div>
  ) : (
    <div style={styles.container}>
      {mon.ribbons?.map((ribbon) => {
        const ribbonDisplay = formatRibbon(ribbon)
        return (
          <Tooltip key={`ribbon_${ribbon}`} title={ribbonDisplay}>
            <img
              draggable={false}
              key={ribbonDisplay}
              alt={ribbonDisplay}
              style={
                Gen9Ribbons.indexOf(ribbon) === mon.affixedRibbon
                  ? styles.affixedRibbon
                  : styles.ribbon
              }
              src={getRibbonImage(ribbon)}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}

export default RibbonsDisplay
