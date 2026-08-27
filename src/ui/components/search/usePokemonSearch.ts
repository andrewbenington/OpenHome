import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Moves } from '@openhome-core/resources'
import { $R, Nullable, NullableOption, Option, R, Result } from '@openhome-core/util/functional'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { OriginGame } from '@pkm-rs/pkg'
import { useState } from 'react'
import { SearchController } from './controllers'

export type PokemonSearchController = SearchController<OHPKM> & {
  nickname: Nullable<string>
  setNickname: (name: Nullable<string>) => void
  knownMove: Nullable<string>
  setKnownMove: (name: Nullable<string>) => void
  originGame: Nullable<OriginGame>
  setOriginGame: (name: Nullable<OriginGame>) => void
}

export function usePokemonForm() {
  const [nickname, setNickname] = useState<string>('')
  const [originGame, setOriginGame] = useState<Option<OriginGame>>()
  const [error, setError] = useState<Nullable<string>>(null)

  function reset() {
    setNickname('')
    setOriginGame(undefined)
    setError(null)
  }

  function populateForm(mon: OHPKM) {
    setNickname(mon.nickname)
    setOriginGame(mon.gameOfOrigin)
  }

  return {
    name: nickname,
    setName: setNickname,
    originGame,
    setOriginGame,

    error,
    setError,

    populateForm,
    reset,
  }
}

export type PokemonFormController = ReturnType<typeof usePokemonForm>

export function usePokemonEdit() {
  const [editingId, setEditingId] = useState<Option<string>>()
  const formController = usePokemonForm()
  const ohpkmStore = useOhpkmStore()

  function reset() {
    setEditingId(undefined)
    formController.reset()
  }

  async function tryUpdate(): Promise<Result<OHPKM>> {
    if (!editingId) {
      return R.Err('No Pokémon is being edited.')
    }

    return $R(await ohpkmStore.setMonNickname(editingId, formController.name)).mapErr(
      (err): string => `Pokémon tracking data not found (id ${err.identifier}`
    )
  }

  function startEditing(pokemon: OHPKM) {
    setEditingId(pokemon.openhomeId)
    formController.populateForm(pokemon)
  }

  function currentItemDescription(): Nullable<string> {
    return editingId ? formController.name : null
  }

  return {
    ...formController,

    startEditing,
    tryUpdate,
    currentItemDescription,
    reset,
  }
}

function prefixMatches(prefix: NullableOption<string>, value: NullableOption<string>): boolean {
  if (!prefix) return true
  return (
    typeof value === 'string' && value.toLocaleUpperCase().startsWith(prefix.toLocaleUpperCase())
  )
}

export function usePokemonSearch(prefilter?: (mon: OHPKM) => boolean): PokemonSearchController {
  const [nickname, setNickname] = useState<Nullable<string>>(null)
  const [knownMove, setKnownMove] = useState<Nullable<string>>(null)
  const [originGame, setOriginGame] = useState<Nullable<OriginGame>>(null)
  const [selectedId, setSelectedId] = useState<Option<string>>()
  const ohpkmStore = useOhpkmStore()
  const [loading, setLoading] = useState(false)

  // TODO: do not get all of these at once
  async function getResults(): Promise<OHPKM[]> {
    setLoading(true)
    const mons = await ohpkmStore.getAllStored()

    const results = mons
      .filter((mon) => prefilter?.(mon) !== false)
      .filter((mon) => prefixMatches(nickname, mon.nickname))
      .filter((mon) =>
        mon.moves.some((moveIndex) => prefixMatches(knownMove, Moves[moveIndex]?.name))
      )
      .filter((mon) => originGame === null || mon.gameOfOrigin === originGame)

    setLoading(false)

    return results
  }

  function clearFields() {
    setNickname(null)
    setKnownMove(null)
    setOriginGame(null)
  }

  function reset() {
    clearFields()
    setSelectedId(undefined)
  }

  async function getSelectedMon() {
    return selectedId ? ohpkmStore.getById(selectedId) : undefined
  }

  return {
    nickname,
    setNickname,
    knownMove,
    setKnownMove,
    originGame,
    setOriginGame,

    fieldsEmpty: !nickname,
    clearFields,

    loading,
    getResults,

    getRowId: (mon) => mon.openhomeId,
    selectedId,
    setSelectedId,
    getSelectedItem: getSelectedMon,

    reset,
  }
}
