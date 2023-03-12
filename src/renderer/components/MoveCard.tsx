import { Card } from '@mui/material';
import { MOVE_DATA } from 'consts';
import { getTypeColor } from 'renderer/util/PokemonSprite';
import { getMoveMaxPP } from 'types/PKMTypes/util';
import { moveCardStyle } from './styles';

interface MoveCardProps {
  move: number;
  movePP?: number;
  maxPP?: number;
}

const MoveCard = ({ move, movePP, maxPP }: MoveCardProps) => {
  return (
    <Card
      style={{
        ...moveCardStyle,
        backgroundColor: getTypeColor(MOVE_DATA[move]?.type),
      }}
    >
      <div
        style={{
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        {MOVE_DATA[move]?.name}
      </div>
      <div
        style={{
          color: 'white',
        }}
      >
        {movePP ?? '--'}/{maxPP ?? '--'} PP
      </div>
    </Card>
  );
};

export default MoveCard;
