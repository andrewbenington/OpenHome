import { PKM } from '../../types/PKMTypes/PKM';
import { getMonSprite, getItemSprite } from '../util/PokemonSprite';
import AttributeRow from './AttributeRow';

const PokemonWithItem = (props: { mon: PKM; format?: string; style: any }) => {
  const { mon, format, style } = props;
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
        <img
          draggable={false}
          alt="pokemon sprite"
          style={{
            maxWidth: 100,
            maxHeight: 100,
            transform: 'scale(2)',
            imageRendering: 'pixelated',
            objectFit: 'contain',
          }}
          src={getMonSprite(mon, mon.format)}
        />
      </div>
      <AttributeRow label="Level" justifyEnd>{mon.level}</AttributeRow>
      <AttributeRow label="EXP" justifyEnd>{mon.exp}</AttributeRow>
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
