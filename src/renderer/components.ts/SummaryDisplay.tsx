import { Card } from '@mui/material';
import { borderRadius } from '@mui/system';
import { Balls } from '../../consts/Balls';
import { getCharacteristic } from '../../consts/Characteristics';
import { GameOfOrigin } from '../../consts/GameOfOrigin';
import MOVES from '../../consts/Moves';
import { Natures } from '../../consts/Natures';
import { pkm, marking } from '../../pkm/pkm';
import { getGameLogo, getTypeColor } from '../util/PokemonSprite';

const getMarkingColor = (value: marking) => {
  return ['grey', 'blue', 'red'][value];
};

const SummaryDisplay = (props: { mon: pkm; updateMon: (mon: pkm) => void }) => {
  const { mon, updateMon } = props;
  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: 'fit-content',
          padding: 10,
          marginLeft: 10,
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
            <p style={{ fontWeight: 'bold' }}>{mon.nickname}</p>
            <Card style={{ padding: '5px 10px 5px 10px', marginLeft: 10 }}>
              {mon.language}
            </Card>
          </div>
          {mon.eggMonth ? (
            <p style={{ textAlign: 'left' }}>{`Egg received ${
              mon.eggMonth
                ? `on ${mon.eggMonth}/${mon.eggDay}/${mon.eggYear}`
                : ''
            } ${mon.eggLocation}.`}</p>
          ) : (
            <></>
          )}
          <p style={{ textAlign: 'left' }}>{`Met ${
            mon.metMonth
              ? `on ${mon.metMonth}/${mon.metDay}/${mon.metYear},`
              : ''
          } at level ${mon.metLevel} ${mon.metLocation}${
            mon.isFatefulEncounter
              ? ', where it met its trainer in a fateful encounter'
              : ''
          }.`}</p>

          {mon.nature ? (
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
          {mon.ivs ? (
            <p>
              {getCharacteristic(
                mon.ivs,
                mon.encryptionConstant ?? mon.personalityValue ?? 0,
                mon.encryptionConstant === undefined
              )}
            </p>
          ) : (
            <></>
          )}
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
              alt={`${GameOfOrigin[mon.gameOfOrigin]?.name} logo`}
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
            {(GameOfOrigin[mon.gameOfOrigin]?.mark ||
              mon.gameOfOrigin === -1) && (
              <img
                alt="origin mark"
                src={`/origin_marks/${
                  mon.gameOfOrigin === -1
                    ? 'GB'
                    : GameOfOrigin[mon.gameOfOrigin]?.mark ?? ''
                }.png`}
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
              <span style={{ color: getMarkingColor(mon.markings[1]) }}>■</span>
              <span style={{ color: getMarkingColor(mon.markings[2]) }}>▲</span>
              <span style={{ color: getMarkingColor(mon.markings[3]) }}>♥</span>
              {mon.markings[4] !== undefined ? (
                <span style={{ color: getMarkingColor(mon.markings[4]) }}>
                  ★
                </span>
              ) : (
                <div />
              )}
              {mon.markings[5] !== undefined ? (
                <span style={{ color: getMarkingColor(mon.markings[5]) }}>
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
        {mon.moves
          .filter((move) => !!move)
          .map((move, id) => {
            return (
              <Card
                key={`move${id}`}
                style={{
                  height: 70,
                  width: 120,
                  margin: 10,
                  backgroundColor: getTypeColor(MOVES[move]?.type),
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    marginBottom: 8,
                    marginTop: 8,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {MOVES[move]?.name}
                </p>
                <p
                  style={{
                    marginTop: 8,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {MOVES[move]?.pp ?? '--'} PP
                </p>
              </Card>
            );
          })}
      </div>
    </div>
  );
};
export default SummaryDisplay;
