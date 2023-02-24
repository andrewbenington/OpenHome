import { PKM } from '../../types/PKM/PKM';
import { getMonSprite, getItemSprite } from '../util/PokemonSprite';

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
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p>{`Level ${mon.level}`}</p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p>{`${mon.exp} EXP`}</p>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <p>{`Item:`}</p>
        {mon.heldItem !== 'None' && (
          <img
            alt="item icon"
            src={getItemSprite(mon.heldItem)}
            style={{ width: 24, height: 24 }}
          />
        )}
        <p>{mon.heldItem}</p>
      </div>
    </div>
  );
};
export default PokemonWithItem;
