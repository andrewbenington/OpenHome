import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { Option } from '@openhome-core/util/functional'
import { useState } from 'react'

export type SearchController<T> = {
  clearFields: () => void
  fieldsEmpty: boolean

  results: T[]

  getRowId: (item: T) => string
  selectedId: Option<string>
  setSelectedId: (id: Option<string>) => void
  selectedItem: T | undefined

  addSearchResult: (newItem: T) => void
  updateSearchResult: (updatedItem: T) => void
  removeSearchResult: (removedItem: T) => void

  reset: () => void
}

export type ControllableSearchComponent<T> = React.FunctionComponent<{
  controller: SearchController<T>
}>

export type PokemonSearchController = SearchController<OHPKM> & {
  nickname: string | null
  setNickname: (name: string | null) => void
  knownMove: string | null
  setKnownMove: (name: string | null) => void
}

export type ModalController = {
  modalOpen: boolean
  setModalOpen: (value: boolean) => void
}

export function useModal(): ModalController {
  const [modalOpen, setModalOpen] = useState(false)

  return { modalOpen, setModalOpen }
}
