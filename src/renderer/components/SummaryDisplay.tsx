import { Card } from '@mui/material';
import { OriginMarks } from 'renderer/images/Images';
import { getMoveMaxPP } from 'types/PKM/util';
import { Balls, GameOfOriginData, MOVE_DATA, Natures } from '../../consts';
import { marking, PKM } from '../../types/PKM/PKM';
import { getGameLogo, getTypeColor } from '../util/PokemonSprite';
import { detailsPaneContentStyle } from './styles';

const getMarkingColor = (value: marking) => {
  return ['grey', 'blue', 'red'][value];
};

const metTimesOfDay = [
  'in the morning',
  'during the daytime',
  'in the evening',
];

const SummaryDisplay = (props: { mon: PKM; updateMon: (mon: PKM) => void }) => {
  const { mon, updateMon } = props;
  return (
    <div style={detailsPaneContentStyle}>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          height: 'fit-content',
        }}
      >
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
                src={`https://www.serebii.net/itemdex/sprites/${Balls[
                  (mon.ball ?? 3) < Balls.length ? mon.ball : 3
                ]
                  .replace('é', 'e')
                  .replace(/\s/g, '')
                  .replace('(', '')
                  .replace(')', '')
                  .toLocaleLowerCase()}.png`}
              />
            ) : (
              <></>
            )}
            <p style={{ fontWeight: 'bold' }}>
              {mon.nickname}
              {mon.affixedRibbonTitle ? ` ${mon.affixedRibbonTitle}` : ''}
            </p>
            <Card style={{ padding: '5px 10px 5px 10px', marginLeft: 10 }}>
              {mon.language}
            </Card>
          </div>
          {mon.eggDate ? (
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
              mon.metTimeOfDay ? metTimesOfDay[mon.metTimeOfDay - 1] + ' ' : ''
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
            <></>
          )}
          {mon.ivs ? <p>{mon.characteristic}</p> : <></>}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 100,
              height: 60,
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
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
              style={{
                width: 100,
                height: 60,
                objectFit: 'contain',
                position: 'absolute',
                left: 0,
                right: 0,
                opacity: 0.6,
              }}
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
                style={{
                  width: 50,
                  height: 50,
                  objectFit: 'contain',
                  zIndex: 2,
                  opacity: 0.8,
                }}
              />
            )}
          </div>
          {mon.markings ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                padding: 5,
                backgroundColor: '#666',
                marginTop: 10,
                borderRadius: 5,
              }}
            >
              <span
                className="No-Select"
                onClick={() => {
                  if (mon.markings) {
                    mon.markings[0] = 1;
                    updateMon(mon);
                  }
                }}
                style={{ color: getMarkingColor(mon.markings[0]) }}
              >
                ●
              </span>
              <span
                className="No-Select"
                style={{ color: getMarkingColor(mon.markings[1]) }}
              >
                ■
              </span>
              <span
                className="No-Select"
                style={{ color: getMarkingColor(mon.markings[2]) }}
              >
                ▲
              </span>
              <span
                className="No-Select"
                style={{ color: getMarkingColor(mon.markings[3]) }}
              >
                ♥
              </span>
              {mon.markings[4] !== undefined ? (
                <span
                  className="No-Select"
                  style={{ color: getMarkingColor(mon.markings[4]) }}
                >
                  ★
                </span>
              ) : (
                <div />
              )}
              {mon.markings[5] !== undefined ? (
                <span
                  className="No-Select"
                  style={{ color: getMarkingColor(mon.markings[5]) }}
                >
                  ◆
                </span>
              ) : (
                <div />
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {mon.moves.map((move, i) => {
          return (
            <Card
              key={`move${i}`}
              style={{
                height: 70,
                width: 120,
                margin: 5,
                backgroundColor: getTypeColor(MOVE_DATA[move]?.type),
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  marginBottom: 8,
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {MOVE_DATA[move]?.name}
              </div>
              <div
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {move ? mon.movePP[i] : '--'}/
                {getMoveMaxPP(move, mon.format, mon.movePPUps[i]) ?? '--'} PP
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
export default SummaryDisplay;
