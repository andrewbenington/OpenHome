import { PA8 } from '@openhome-core/pkm'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getMoveMaxPP } from '@openhome-core/pkm/util'
import { Move, Moves } from '@openhome-core/resources'
import { FourMoves } from '@openhome-core/util/types'
import { EditIcon } from '@openhome-ui/components/Icons'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import MoveCard from '@openhome-ui/components/pokemon/MoveCard'
import ToggleButton from '@openhome-ui/components/ToggleButton'
import { Typeahead } from '@openhome-ui/components/typeahead'
import { MoveSlotIndex, useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { Flex, Grid, Inset, Separator } from '@radix-ui/themes'
import { useState } from 'react'
import './MovesTab.css'

export default function MovesTab(props: { mon: PKMInterface }) {
  const { mon } = props
  const [editing, setEditing] = useState(false)
  const ohpkmStore = useOhpkmStore()

  // updated immediately, so ui doesnt have to wait for ohpkm store to update moves before reflecting changes
  const [pendingMoves, setPendingMoves] = useState<FourMoves>(mon.moves)

  return (
    <Flex className="pokemon-modal-content" direction="column" height="100%">
      <div className="pokemon-modal-card pokemon-moves-card">
        <OhoFlex.RowStart className="pokemon-moves-card-header">
          <h3 className="pokemon-moves-card-title">Current Moves</h3>
          <ToggleButton state={editing} setState={setEditing} icon={EditIcon} />
        </OhoFlex.RowStart>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <Flex className="pokemon-moves-card-content" direction="row" justify="between" gap="0.5rem">
          {pendingMoves?.map((moveId, i) =>
            editing && mon instanceof OHPKM ? (
              <MoveSelect
                key={`move_slot_${i}`}
                currentMoveIds={pendingMoves}
                learnedMoveIds={Array.from(mon.learnedMovesWasm)}
                uniqueFieldId={`move_slot_${i}`}
                value={moveId}
                onChange={async (moveId) => {
                  pendingMoves[i] = moveId ?? 0
                  setPendingMoves(pendingMoves)
                  await ohpkmStore.setMonMove(mon.openhomeId, moveId, i as MoveSlotIndex)
                }}
              />
            ) : (
              <MoveCard
                key={`relearn-${i}-${moveId}`}
                move={moveId}
                movePP={mon.movePP[i]}
                maxPP={getMoveMaxPP(moveId, mon.format, mon.movePPUps[i])}
                ppUps={mon.movePPUps[i]}
                plusMove={mon.plusMovesLza?.some((m) => m.id === moveId)}
                masteredLa={
                  (mon instanceof PA8 || mon instanceof OHPKM) && mon.isMasteredMoveLa(moveId)
                }
              />
            )
          )}
        </Flex>
      </div>
      <div className="pokemon-modal-card pokemon-moves-card">
        <h3 className="pokemon-moves-card-title">Egg/Event Moves</h3>
        <Inset side="x" p="0" mx="-2">
          <Separator />
        </Inset>
        <Flex className="pokemon-moves-card-content" direction="row" justify="center" gap="0.5rem">
          {mon.relearnMoves?.map((move, i) => (
            <MoveCard key={`relearn-${i}-${move}`} move={move} noPP />
          ))}
        </Flex>
      </div>
      {extraPokemonMoves(mon).map(
        ({ label, moves }) =>
          moves.length > 0 && (
            <div key={label} className="pokemon-modal-card pokemon-moves-card">
              <h3 className="pokemon-moves-card-title">{label}</h3>
              <Inset side="x" p="0" mx="-2">
                <Separator />
              </Inset>
              <Grid
                className="pokemon-moves-card-content"
                columns="4"
                justify="center"
                gap="0.5rem"
              >
                {moves.map((move, i) => (
                  <MoveCard
                    key={`relearn-${i}-${move.id}`}
                    move={move.id}
                    noPP
                    plusMove={mon instanceof OHPKM && mon.isPlusMove(move.id)}
                    masteredLa={mon instanceof OHPKM && mon.isMasteredMoveLa(move.id)}
                  />
                ))}
              </Grid>
            </div>
          )
      )}
    </Flex>
  )
}

type ExtraPokemonMoves = {
  label: string
  moves: Move[]
}

function extraPokemonMoves(mon: PKMInterface): ExtraPokemonMoves[] {
  const extraMoves: ExtraPokemonMoves[] = []

  function include(label: string, moves: Move[]) {
    extraMoves.push({ label, moves })
  }

  if (mon instanceof OHPKM) {
    include(
      'All Known Moves',
      Array.from(mon.learnedMovesWasm).map((id) => Moves[id])
    )
  }

  if (mon.plusMovesLza) {
    include('Plus Moves', mon.plusMovesLza)
  }

  if (mon.tutorMovesLa) {
    include('Tutor Moves (Legends Arceus)', mon.tutorMovesLa)
  }

  if (mon.tmMovesLza) {
    include('TMs (Legends Z-A)', mon.tmMovesLza)
  }

  if (mon.tmMovesSv) {
    include('TMs (Scarlet/Violet)', mon.tmMovesSv)
  }

  if (mon.trMovesSwSh) {
    include('TRs (Sword/Shield)', mon.trMovesSwSh)
  }

  return extraMoves
}

type MoveSelectProps = {
  learnedMoveIds: number[]
  currentMoveIds: number[]
  value?: number | undefined
  onChange: (newValue: number | undefined) => void
  uniqueFieldId: string
}

function MoveSelect(props: MoveSelectProps) {
  return (
    <Typeahead
      uniqueFieldId={props.uniqueFieldId}
      options={props.learnedMoveIds
        .filter((moveId) => !props.currentMoveIds.includes(moveId))
        .map((moveId) => Moves[moveId])}
      getOptionString={(move) => move.name}
      getOptionUniqueID={(move) => move.id.toString()}
      value={props.value ? Moves[props.value] : undefined}
      onChange={(value) => props.onChange(value?.id)}
    />
  )
}
