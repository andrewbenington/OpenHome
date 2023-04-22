import { POKEMON_DATA } from 'consts';
import { useMemo } from 'react';
import { StringToStringMap } from 'types/types';
import { PKM } from '../../types/PKMTypes/PKM';
import { getItemSprite } from '../util/PokemonSprite';
import AttributeRow from './AttributeRow';

interface PokemonWithItemProps {
  mon: PKM;
  style: any;
  sprites?: StringToStringMap;
}

const PokemonWithItem = (props: PokemonWithItemProps) => {
  const { mon, style, sprites } = props;
  const spriteAltText = useMemo(() => {
    const monData = POKEMON_DATA[mon.dexNum]?.formes[mon.formNum];
    if (!monData) return 'pokemon sprite';
    return `${monData.formeName}${mon.isShiny ? '-shiny' : ''} sprite`;
  }, [mon]);

  return (
    <div style={{ padding: 10, ...style }}>
      <div
        style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {sprites && (
          <img
            draggable={false}
            alt={`${spriteAltText}`}
            style={{
              maxWidth: 100,
              maxHeight: 100,
              transform: 'scale(2)',
              imageRendering: 'pixelated',
              objectFit: 'contain',
            }}
            src={sprites[mon.format]}
          />
        )}
      </div>
      <AttributeRow label="Level" justifyEnd>
        {mon.level}
      </AttributeRow>
      <AttributeRow label="EXP" justifyEnd>
        {mon.exp}
      </AttributeRow>
      <AttributeRow label="Item" justifyEnd>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {mon.heldItem !== 'None' && (
            <img
              alt="item icon"
              src={getItemSprite(mon.heldItem)}
              style={{ width: 24, height: 24, marginRight: 5 }}
            />
          )}
          <p>{mon.heldItem}</p>
        </div>
      </AttributeRow>
    </div>
  );
};
export default PokemonWithItem;
