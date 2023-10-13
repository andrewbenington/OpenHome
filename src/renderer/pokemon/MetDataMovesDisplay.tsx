import { Card } from '@mui/material';
import Markings from 'renderer/components/Markings';
import { BallsList, OriginMarks } from 'renderer/images/Images';
import { getMoveMaxPP } from 'types/PKMTypes/util';
import { Styles } from 'types/types';
import { GameOfOriginData, Natures } from '../../consts';
import { PKM } from '../../types/PKMTypes/PKM';
import { getGameLogo } from '../util/PokemonSprite';
import MoveCard from './MoveCard';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    height: 'calc(100% - 20px)',
    padding: 10,
  },
  detailsContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    height: 'fit-content',
  },
  language: { padding: '5px 10px 5px 10px', marginLeft: 10 },
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
} as Styles;

const metTimesOfDay = [
  'in the morning',
  'during the daytime',
  'in the evening',
];

const MetDataMovesDisplay = (props: { mon: PKM }) => {
  const { mon } = props;
  return (
    <div style={styles.container}>
      <div style={styles.detailsContainer}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {mon.ball ? (
              <img
                draggable={false}
                alt="poke ball type"
                style={{ width: 24, height: 24 }}
                src={BallsList[mon.ball ?? 3]}
              />
            ) : (
              <div />
            )}
            <p style={{ fontWeight: 'bold' }}>
              {mon.nickname}
              {mon.affixedRibbonTitle ? ` ${mon.affixedRibbonTitle}` : ''}
            </p>
            <Card style={styles.language}>{mon.language}</Card>
          </div>
          {mon.eggDate && mon.eggLocation ? (
            <p style={{ textAlign: 'left' }}>{`Egg received ${
              mon.eggDate
                ? `on ${mon.eggDate.month}/${mon.eggDate.day}/${mon.eggDate.year}`
                : ''
            } ${mon.eggLocation}.`}</p>
          ) : (
            <div />
          )}
          {mon.metLocation ? (
            <p style={{ textAlign: 'left' }}>{`Met ${
              mon.metTimeOfDay ? `${metTimesOfDay[mon.metTimeOfDay - 1]} ` : ''
            }${
              mon.metDate
                ? `on ${mon.metDate.month}/${mon.metDate.day}/${mon.metDate.year},`
                : ''
            }${mon.metLevel ? ` at level ${mon.metLevel},` : ''} ${
              mon.metLocation
            }${
              mon.isFatefulEncounter
                ? ' where it met its trainer in a fateful encounter'
                : ''
            }.`}</p>
          ) : (
            <div />
          )}

          {mon.nature !== undefined ? (
            <p style={{ textAlign: 'left' }}>
              Has a
              <span>
                {['A', 'E', 'I', 'O', 'U'].includes(
                  (Natures[mon.statNature ?? mon.nature] ?? 'Undefined')[0]
                )
                  ? 'n'
                  : ''}
              </span>{' '}
              <span style={{ fontWeight: 'bold' }}>
                {Natures[mon.statNature ?? mon.nature]}
              </span>{' '}
              nature{' '}
              <span>
                {mon.statNature && mon.statNature !== mon.nature
                  ? `(originally ${Natures[mon.nature]})`
                  : ''}
              </span>
            </p>
          ) : (
            <div />
          )}
          {mon.ivs ? <p>{mon.characteristic}</p> : <div />}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
          }}
        >
          <div style={styles.gameContainer}>
            <img
              draggable={false}
              alt={`${GameOfOriginData[mon.gameOfOrigin]?.name} logo`}
              src={
                getGameLogo(
                  mon.gameOfOrigin,
                  mon.dexNum,
                  mon.ribbons.includes('National') || mon.isShadow
                ) ?? ''
              }
              style={styles.gameImage}
            />
            {(GameOfOriginData[mon.gameOfOrigin]?.mark ||
              mon.gameOfOrigin === -1) && (
              <img
                draggable={false}
                alt="origin mark"
                src={
                  OriginMarks[
                    mon.gameOfOrigin === -1
                      ? 'GB'
                      : GameOfOriginData[mon.gameOfOrigin]?.mark ?? ''
                  ]
                }
                style={styles.originMark}
              />
            )}
          </div>
          {mon.markings ? <Markings markings={mon.markings} /> : <div />}
        </div>
      </div>
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
    </div>
  );
};
export default MetDataMovesDisplay;
