import { PA8 } from '@openhome-core/pkm'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getMoveMaxPP } from '@openhome-core/pkm/util'
import { EditIcon } from '@openhome-ui/components/Icons'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import MoveCard from '@openhome-ui/components/pokemon/MoveCard'
import { Button, Flex, Grid, Inset, Separator } from '@radix-ui/themes'
import './MovesTab.css'

const MovesTab = (props: { mon: PKMInterface }) => {
  const { mon } = props

  return (
    <Flex className="pokemon-modal-content" direction="column" height="100%">
      <div className="pokemon-modal-card pokemon-moves-card">
        <OhoFlex.RowStart className="pokemon-moves-card-header">
          <h3 className="pokemon-moves-card-title">Current Moves</h3>
          <Button className="mini-button" variant="outline" color="gray">
            <EditIcon />
          </Button>
        </OhoFlex.RowStart>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <Flex className="pokemon-moves-card-content" direction="row" justify="center" gap="0.5rem">
          {mon.moves?.map((move, i) => (
            <MoveCard
              key={`relearn-${i}-${move}`}
              move={move}
              movePP={mon.movePP[i]}
              maxPP={getMoveMaxPP(move, mon.format, mon.movePPUps[i])}
              plusMove={mon.plusMoveFlags?.getMoveIds().some((id) => id === move)}
              masteredLa={
                (mon instanceof PA8 || mon instanceof OHPKM) && mon.isMasteredMoveLa(move)
              }
            />
          ))}
        </Flex>
      </div>
      <div className="pokemon-modal-card">
        <h3 className="pokemon-moves-card-title">Egg/Event Moves</h3>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <Flex direction="row" justify="center" gap="0.5rem">
          {mon.relearnMoves?.map((move, i) => (
            <MoveCard key={`relearn-${i}-${move}`} move={move} noPP />
          ))}
        </Flex>
      </div>
      {mon instanceof OHPKM && (
        <div className="pokemon-modal-card">
          <h3 className="pokemon-moves-card-title">All Known Moves</h3>
          <Inset side="x" p="0" mx="-2">
            <Separator />
          </Inset>
          <Grid columns="4" justify="center" gap="0.5rem">
            {Array.from(mon.learnedMovesWasm).map((move, i) => (
              <MoveCard
                key={`relearn-${i}-${move}`}
                move={move}
                noPP
                plusMove={mon.isPlusMove(move)}
                masteredLa={mon.isMasteredMoveLa(move)}
              />
            ))}
          </Grid>
        </div>
      )}
    </Flex>
  )
}

export default MovesTab
