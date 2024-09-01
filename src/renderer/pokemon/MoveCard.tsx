import { Card } from '@mui/joy'
import { MOVE_DATA } from '../../consts/Moves'
import { getTypeColor } from '../util/PokemonSprite'
import { moveCardStyle } from './styles'

interface MoveCardProps {
  move: number
  movePP?: number
  maxPP?: number
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
  )
}

export default MoveCard
