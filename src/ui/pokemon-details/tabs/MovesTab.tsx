import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getMoveMaxPP } from '@openhome-core/pkm/util'
import MoveCard from '@openhome-ui/components/pokemon/MoveCard'
import { Flex, Inset, Separator } from '@radix-ui/themes'
import './MovesTab.css'

const MovesTab = (props: { mon: PKMInterface }) => {
  const { mon } = props

  return (
    <Flex className="pokemon-modal-content" direction="column" height="100%">
      <div className="pokemon-modal-card">
        <h2 className="pokemon-modal-header">Current Moves</h2>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <Flex direction="row" justify="center" gap="0.5rem">
          {mon.moves?.map((move, i) => (
            <MoveCard
              key={`relearn-${i}-${move}`}
              move={move}
              movePP={mon.movePP[i]}
              maxPP={getMoveMaxPP(move, mon.format, mon.movePPUps[i])}
            />
          ))}
        </Flex>
      </div>
      <div className="pokemon-modal-card">
        <h2 className="pokemon-modal-header">Relearn Moves</h2>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <Flex direction="row" justify="center" gap="0.5rem">
          {mon.relearnMoves?.map((move, i) => (
            <MoveCard key={`relearn-${i}-${move}`} move={move} />
          ))}
        </Flex>
      </div>
      {mon instanceof OHPKM && (
        <div className="pokemon-modal-card">
          <h2 className="pokemon-modal-header">All Known Moves</h2>
          <Inset side="x" p="0" mx="-2">
            <Separator />
          </Inset>
          <Flex direction="row" justify="center" gap="0.5rem">
            {Array.from(mon.learnedMovesWasm).map((move, i) => (
              <MoveCard key={`relearn-${i}-${move}`} move={move} />
            ))}
          </Flex>
        </div>
      )}
    </Flex>
  )
}

export default MovesTab
