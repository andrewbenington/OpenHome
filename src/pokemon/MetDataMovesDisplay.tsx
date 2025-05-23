import { Badge, Flex } from '@radix-ui/themes'
import {
  GameOfOriginData,
  getLocationString,
  NatureToString,
  RibbonTitles,
} from 'pokemon-resources'
import { useContext, useMemo } from 'react'
import Markings from '../components/Markings'
import { getOriginMark } from '../images/game'
import { getPublicImageURL } from '../images/images'
import { getBallIconPath } from '../images/items'
import { getMonSaveLogo } from '../saves/util'
import { AppInfoContext } from '../state/appInfo'
import { PKMInterface } from '../types/interfaces'
import { getCharacteristic, getMoveMaxPP } from '../types/pkm/util'
import { getGameName, getPluginIdentifier } from '../types/SAVTypes/util'
import { Styles } from '../types/types'
import MoveCard from './MoveCard'

const styles = {
  gameContainer: {
    position: 'relative',
    width: 100,
    height: 60,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  gameImage: {
    width: 100,
    height: 60,
    objectFit: 'contain',
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0.6,
  },
  originMark: {
    width: 50,
    height: 50,
    objectFit: 'contain',
    zIndex: 2,
    opacity: 0.8,
  },
  centerFlex: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  description: {
    textAlign: 'left',
  },
} as Styles

const metTimesOfDay = ['in the morning', 'during the daytime', 'in the evening']

const MetDataMovesDisplay = (props: { mon: PKMInterface }) => {
  const { mon } = props
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)

  const eggMessage = useMemo(() => {
    if (!mon.eggLocationIndex || !mon.eggDate || !mon.gameOfOrigin) {
      return undefined
    }
    return `Egg received on ${mon.eggDate.month}/${mon.eggDate.day}/${
      mon.eggDate.year
    } ${getLocationString(mon.gameOfOrigin, mon.eggLocationIndex, mon.format, true)}.`
  }, [mon])

  const metMessage = useMemo(() => {
    if (!mon.metLocationIndex) {
      return 'Met location unknown.'
    }

    let message = 'Met'

    if (mon.pluginOrigin) {
      const saveType = getEnabledSaveTypes().find(
        (saveType) => mon.pluginOrigin === getPluginIdentifier(saveType)
      )

      message += ` in ${saveType ? getGameName(saveType) : '(unknown game)'}`
    }

    if (mon.metTimeOfDay) {
      message += ` ${metTimesOfDay[mon.metTimeOfDay - 1]}`
    }
    if (mon.metDate) {
      message += ` on ${mon.metDate.month}/${mon.metDate.day}/${mon.metDate.year}`
    }
    if (mon.gameOfOrigin && mon.metLocationIndex) {
      const location = getLocationString(mon.gameOfOrigin, mon.metLocationIndex, mon.format)

      message += ` ${location}`
    }

    if ('isFatefulEncounter' in mon && mon.isFatefulEncounter) {
      message += ', where it met its trainer in a fateful encounter'
    }
    message += '.'
    if (mon.metLevel) {
      message += ` At the time, it was level ${mon.metLevel}.`
    }
    return message
  }, [getEnabledSaveTypes, mon])

  const natureMessage = useMemo(() => {
    const currentNature = mon.statNature ?? mon.nature ?? 0
    let message = 'Has a'
    const vowelStart = ['A', 'E', 'I', 'O', 'U'].includes(
      (NatureToString(currentNature) ?? 'Undefined')[0]
    )

    if (vowelStart) {
      message += 'n'
    }
    message += ` ${NatureToString(currentNature)} nature.`
    if (mon.statNature && mon.nature !== mon.statNature) {
      message += ` (originally ${NatureToString(mon.statNature)})`
    }
    return message
  }, [mon])

  return (
    <Flex direction="column" ml="4" mr="4" mt="2" height="calc(100% - 24px)">
      <Flex direction="row" style={{ flex: 1 }}>
        <div style={{ flex: 1 }}>
          <Flex direction="row" gap="1" align="center">
            {'ball' in mon && mon.ball ? (
              <img
                draggable={false}
                alt="poke ball type"
                style={{ width: 24, height: 24 }}
                src={getPublicImageURL(getBallIconPath(mon.ball))}
              />
            ) : (
              <div />
            )}
            <p style={{ fontWeight: 'bold' }}>
              {mon.nickname}
              {'affixedRibbon' in mon && mon.affixedRibbon
                ? ` ${RibbonTitles[mon.affixedRibbon]}`
                : ''}
            </p>
            <Badge variant="solid" color="gray" ml="2" size="2">
              {mon.language}
            </Badge>
          </Flex>
          {eggMessage ? <p style={styles.description}>{eggMessage}</p> : <div />}
          <p style={styles.description}>{metMessage}</p>
          {/* check for undefined because 0 nature is Hardy */}
          {'nature' in mon ? (
            <div>
              <p style={styles.description}>{natureMessage}</p>
              <p>{getCharacteristic(mon as any)}</p>
            </div>
          ) : (
            <div />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
          }}
        >
          <div style={styles.gameContainer}>
            {mon.gameOfOrigin && (
              <img
                draggable={false}
                alt={`${
                  mon.pluginOrigin ? mon.pluginOrigin : GameOfOriginData[mon.gameOfOrigin]?.name
                } logo`}
                src={getPublicImageURL(getMonSaveLogo(mon, getEnabledSaveTypes()) ?? '')}
                style={styles.gameImage}
              />
            )}
            {mon.gameOfOrigin && GameOfOriginData[mon.gameOfOrigin]?.mark && (
              <img
                draggable={false}
                alt="origin mark"
                src={getPublicImageURL(
                  getOriginMark(
                    mon.gameOfOrigin === -1
                      ? 'GB'
                      : (GameOfOriginData[mon.gameOfOrigin]?.mark ?? '')
                  )
                )}
                style={styles.originMark}
              />
            )}
          </div>
          {'markings' in mon && mon.markings ? <Markings markings={mon.markings} /> : <div />}
        </div>
      </Flex>
      <div style={{ flex: 1 }} />
      <div style={styles.centerFlex}>
        <MoveCard
          move={mon.moves[0]}
          movePP={mon.moves[0] ? mon.movePP[0] : undefined}
          maxPP={getMoveMaxPP(mon.moves[0], mon.format, mon.movePPUps[0])}
        />
        <MoveCard
          move={mon.moves[1]}
          movePP={mon.moves[1] ? mon.movePP[1] : undefined}
          maxPP={getMoveMaxPP(mon.moves[1], mon.format, mon.movePPUps[1])}
        />
      </div>
      <div style={styles.centerFlex}>
        <MoveCard
          move={mon.moves[2]}
          movePP={mon.moves[2] ? mon.movePP[2] : undefined}
          maxPP={getMoveMaxPP(mon.moves[2], mon.format, mon.movePPUps[2])}
        />
        <MoveCard
          move={mon.moves[3]}
          movePP={mon.moves[3] ? mon.movePP[3] : undefined}
          maxPP={getMoveMaxPP(mon.moves[3], mon.format, mon.movePPUps[3])}
        />
      </div>
    </Flex>
  )
}

export default MetDataMovesDisplay
