import { getMonFileIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { $R, Option, R, Result } from '@openhome-core/util/functional'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { OriginGame } from '@pkm-rs/pkg'
import { useState } from 'react'
import { PokemonSearchController } from './controllers'

export function usePokemonForm() {
  const [nickname, setNickname] = useState<string>('')
  const [originGame, setOriginGame] = useState<Option<OriginGame>>()
  const [error, setError] = useState<string | null>(null)

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

    return $R(ohpkmStore.setMonNickname(editingId, formController.name)).mapErr(
      (err): string => `Pokémon tracking data not found (id ${err.identifier}`
    )
  }

  function startEditing(pokemon: OHPKM) {
    setEditingId(getMonFileIdentifier(pokemon))
    formController.populateForm(pokemon)
  }

  function currentItemDescription(): string | null {
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

export function usePokemonSearch(): PokemonSearchController {
  const [nickname, setNickname] = useState<string | null>(null)
  const [results, setResults] = useState<OHPKM[]>([])
  const [selectedId, setSelectedId] = useState<Option<string>>()
  const mons = useOhpkmStore().getAllStored()

  const filtered = mons.filter((mon) => nickname === null || mon.nickname.startsWith(nickname))

  function clearFields() {
    setNickname(null)
  }

  function reset() {
    clearFields()
    setSelectedId(undefined)
    setResults([])
  }

  function addSearchResult(newPokemon: OHPKM) {
    const fieldsEmpty = !nickname
    const nameMismatch = nickname && !prefixMatchesCaseInsensitive(nickname, newPokemon.nickname)

    if (fieldsEmpty || nameMismatch) {
      return
    }

    setResults((prevResults) => [...prevResults, newPokemon])
  }

  function updateSearchResult(updatedMon: OHPKM) {
    setResults((prevResults) =>
      prevResults.map((mon) => (mon.openhomeId === updatedMon.openhomeId ? updatedMon : mon))
    )
  }

  function removeSearchResult(removedMon: OHPKM) {
    setResults((prevResults) =>
      prevResults.filter((mon) => mon.openhomeId !== removedMon.openhomeId)
    )
  }

  const selectedItem = results.find((mon) => getMonFileIdentifier(mon) === selectedId)

  return {
    nickname,
    setNickname,
    knownMove: null,
    setKnownMove: () => {},

    fieldsEmpty: !nickname,
    clearFields,

    results: filtered,

    getRowId: (mon) => String(getMonFileIdentifier(mon)),
    selectedId,
    setSelectedId,
    selectedItem,
    addSearchResult,
    updateSearchResult,
    removeSearchResult,

    reset,
  }
}

function prefixMatchesCaseInsensitive(prefix: string, text: any) {
  return text.toLocaleUpperCase().startsWith(prefix.toLocaleUpperCase())
}
