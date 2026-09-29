import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Filter } from '@openhome-core/tauri/spectaCommands'
import { Nullable, Option, R, Result } from '@openhome-core/util/functional'
import { O } from '@openhome-core/util/option'
import { isThenable } from '@openhome-core/util/promise'
import { usePokemonTable } from '@openhome-ui/hooks/pokemonTable'
import useOhpkmGrid, { OhpkmRowData } from '@openhome-ui/ohpkmGrid'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { OriginGame } from '@pkm-rs/pkg'
import { useState } from 'react'
import { SearchController } from './controllers'

export type PokemonSearchController = SearchController<OhpkmRowData> & {
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

    return ohpkmStore
      .setMonNickname(editingId, formController.name)
      .then(R.mapErr((err): string => `Pokémon tracking data not found (id ${err.identifier}`))
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

export function usePokemonSearch(...prefilter: Filter[]): PokemonSearchController {
  const [nickname, setNickname] = useState<Nullable<string>>(null)
  const [knownMove, setKnownMove] = useState<Nullable<string>>(null)
  const [originGame, setOriginGame] = useState<Nullable<OriginGame>>(null)
  const [selectedId, setSelectedId] = useState<Option<string>>()
  const ohpkmStore = useOhpkmStore()
  const { preloadRowData } = useOhpkmGrid()

  let filters: Filter[] = prefilter ?? []
  if (knownMove) filters.push({ moveTextPrefixEng: knownMove })
  if (nickname) filters.push({ nicknamePrefix: nickname })
  if (originGame) filters.push({ originGame })

  const table = usePokemonTable('ohpkm-search', filters)

  function clearFields() {
    setNickname(null)
    setKnownMove(null)
    setOriginGame(null)
  }

  function reset() {
    clearFields()
    setSelectedId(undefined)
  }

  function getSelectedMon() {
    if (!selectedId) return undefined

    const lookupResult = ohpkmStore.getById(selectedId)
    if (!lookupResult) return undefined

    return isThenable(lookupResult)
      ? O.after(lookupResult).then(preloadRowData).get()
      : preloadRowData(lookupResult)
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

    loading: table.query.isLoading,
    results: table.currentRows,
    getResults: () =>
      table.query
        .refetch()
        .then(
          (results) => results.data?.pages.filter(R.isOk).flatMap((page) => page.data.results) ?? []
        ),

    getRowId: (mon) => mon.openhomeId,
    selectedId,
    setSelectedId,
    getSelectedItem: getSelectedMon,

    reset,
  }
}
