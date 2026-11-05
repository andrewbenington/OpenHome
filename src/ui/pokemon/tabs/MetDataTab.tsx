import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { getLocationString, getLocationStringOrOrigin } from '@openhome-core/pkm/MetLocation'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getCharacteristic } from '@openhome-core/pkm/util'
import { getPluginIdentifier } from '@openhome-core/save/util'
import Markings from '@openhome-ui/components/pokemon/Markings'
import { BallsImageList } from '@openhome-ui/images/items'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { formatTitleAndNickname } from '@openhome-ui/util/format'
import { Ball, Language, Languages, OriginGame, OriginGames } from '@pkm-rs/pkg'
import { Badge, Flex } from '@radix-ui/themes'
import { useContext, useMemo } from 'react'
import './MetDataTab.css'

const metTimesOfDay = ['in the morning', 'during the daytime', 'in the evening']

const MetDataTab = (props: { mon: PKMInterface }) => {
  const { mon } = props
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const { updateMonMarkings } = useOhpkmStore()

  const eggMessage = useMemo(() => {
    if (!mon.eggLocationIndex || !mon.eggDate || !mon.gameOfOrigin) {
      return undefined
    }
    return `Egg received on ${mon.eggDate.month}/${mon.eggDate.day}/${
      mon.eggDate.year
    } ${getLocationString(mon.gameOfOrigin, mon.eggLocationIndex, mon.nationalDex, mon.trainerID, mon.trainerName, Language.English, true)}.` // todo: i18n
  }, [mon])

  const metMessage = useMemo(() => {
    if (
      mon.gameOfOrigin !== OriginGame.ColosseumXd &&
      !mon.metLocationIndex ||
      (OriginGames.isBdsp(mon.gameOfOrigin) && mon.metLocationIndex === 65535) // BDSP Egg
    ) {
      return 'Met location unknown.' // todo: i18n
    }

    if (mon.format === 'PK3' && mon.gameOfOrigin === OriginGame.ColosseumXd) {
      return 'Obtained in a trade.' // todo: i18n
    }

    let isEeveelution = [133, 134, 135, 136, 196, 197, 470, 471, 720].includes(mon.nationalDex)
    let isXdStarter = mon.gameOfOrigin === OriginGame.ColosseumXd && isEeveelution && mon.metLocationIndex === 0 

    let isGcnMetAt254 = mon.gameOfOrigin === OriginGame.ColosseumXd && mon.metLocationIndex === 254
    let isColoStarter = isGcnMetAt254 && [196, 197].includes(mon.nationalDex)
    let isDukingMon = [213, 246, 247, 248, 307, 308, 311].includes(mon.nationalDex)
    // TODO: non-English Trainer names
    let isDukingGift = isGcnMetAt254 && isDukingMon && mon.trainerID === 37149 && mon.trainerName === 'DUKING'

    let message = 'Met'
    if (isXdStarter) {
      if (mon.format === 'XDPKM') return `Obtained from ${mon.trainerName}'s dad.`
      if (mon.format === 'OHPKM') {
        message = `Obtained from ${mon.trainerName}'s dad` // todo: i18n
      }
    }
    if (isColoStarter) {
      if (mon.format === 'COLOPKM') return `${mon.trainerName}'s old friend.`
      if (mon.format === 'OHPKM') {
        message = `${mon.trainerName}'s old friend, met` // todo: i18n
      }
    }
    if (mon.format === 'PK3' && mon.metLocationIndex === 254) {
      message = `Obtained in a trade` // todo: i18n
    }

    if (mon.pluginOrigin) {
      const pluginSaveType = getEnabledSaveTypes().find(
        (saveType) => mon.pluginOrigin === getPluginIdentifier(saveType)
      )

      if (pluginSaveType) {
        message += ` in ${pluginSaveType.saveTypeName}`
      } else {
        message += ` in ${OriginGames.gameNameFull(mon.gameOfOrigin) ?? '(unknown game)'}`
      }
    }

    if (mon.metTimeOfDay) {
      message += ` ${metTimesOfDay[mon.metTimeOfDay - 1]}`
    }
    if (mon.metDate) {
      if (mon.format === 'OHPKM' && (isColoStarter || isXdStarter)) {
        message += ' sometime before'
      } else {
        message += ' on'
      }
      message += ` ${mon.metDate.month}/${mon.metDate.day}/${mon.metDate.year}`
    }

    if (mon.gameOfOrigin && mon.metLocationIndex) {
      if ((mon.format === 'OHPKM' && isColoStarter) || (mon.format === 'PK3' && mon.metLocationIndex === 254)) {
        // suppress the normal met location, as it's already handled above
        message += ''
      } else {
        try {
          const location = getLocationStringOrOrigin(
            mon.gameOfOrigin,
            mon.metLocationIndex,
            mon.format,
            mon.nationalDex,
            mon.trainerID,
            mon.trainerName,
            Language.English
          )

          message += ` ${location}`
        } catch (e) {
          console.error('Error getting location string', {
            error: e,
            game: mon.gameOfOrigin,
            index: mon.metLocationIndex,
            format: mon.format,
          })
          message += ' at an unknown location'
        }
      }
    }

    if (!['PK3', 'COLOPKM', 'XDPKM'].includes(mon.format) && 'isFatefulEncounter' in mon && mon.isFatefulEncounter) {
      message += ', where it met its Trainer in a fateful encounter'
    }

    message += '.'

    if (
      !(
        isGcnMetAt254 || isXdStarter ||
        (mon.format === 'PK3' && mon.gameOfOrigin === OriginGame.ColosseumXd)
      ) && mon.metLevel
    ) {
      message += ` At the time, it was level ${mon.metLevel}.`
    }

    return message
  }, [getEnabledSaveTypes, mon])

  const natureMessage = useMemo(() => {
    const currentNature = mon.statNature ?? mon.nature
    if (!currentNature || !mon.nature) return undefined

    let message = 'Has a'
    const vowelStart = ['A', 'E', 'I', 'O', 'U'].includes(currentNature.name[0])

    if (vowelStart) {
      message += 'n'
    }
    message += ` ${currentNature.name} nature.`
    if (mon.statNature && !mon.nature?.equals(mon.statNature)) {
      message += ` (originally ${mon.nature.name})`
    }
    return message
  }, [mon])

  // rom hack origin mons will all have an "official origin game" that corresponds to the rom hack's base game. The origin mark will use that base game.
  const markImage = mon.gameOfOrigin ? OriginGames.markPath(mon.gameOfOrigin) : undefined

  return (
    <Flex className="pokemon-modal-content" direction="column" height="100%">
      <div
        className="pokemon-modal-card"
        style={{ display: 'flex', flexDirection: 'row', flex: 1 }}
      >
        <div className="met-data-left-side">
          <Flex direction="row" gap="1" align="center">
            <img
              draggable={false}
              alt="poke ball type"
              style={{ width: 24, height: 24 }}
              src={BallsImageList[mon.ball ?? Ball.Poke]}
            />
            <p className="pokemon-nickname">{formatTitleAndNickname(mon)}</p>
            <Badge variant="solid" color="gray" ml="2" size="1">
              {Languages.stringFromByte(mon.language)}
            </Badge>
          </Flex>
          <div className="met-data-text">
            {eggMessage && <p>{eggMessage}</p>}
            <p>{metMessage}</p>
            {natureMessage && <p>{natureMessage}</p>}
            <p>{getCharacteristic(mon)}</p>
          </div>
        </div>
        <Flex direction="column">
          <div className="game-container">
            {mon.gameOfOrigin && (
              <img
                className="game-image"
                draggable={false}
                alt={`${mon.pluginOrigin ?? OriginGames.gameNameFull(mon.gameOfOrigin)} logo`}
                src={
                  mon.pluginOrigin
                    ? `logos/${mon.pluginOrigin}.png`
                    : OriginGames.logoPath(mon.gameOfOrigin)
                }
              />
            )}
            {markImage && (
              <img className="origin-mark" draggable={false} alt="origin mark" src={markImage} />
            )}
          </div>
          {mon instanceof OHPKM ? (
            <Markings
              markings={mon.markings}
              onUpdate={(newMarkings) => updateMonMarkings(mon.openhomeId, newMarkings)}
            />
          ) : 'markings' in mon && mon.markings ? (
            <Markings markings={mon.markings} />
          ) : (
            <div />
          )}
        </Flex>
      </div>
    </Flex>
  )
}

export default MetDataTab
