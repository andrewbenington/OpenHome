import { Option } from '@openhome-core/util/functional'
import { useState } from 'react'

export type SearchController<T> = {
  clearFields: () => void
  fieldsEmpty: boolean

  loading: boolean
  getResults: () => Promise<T[]>

  getRowId: (item: T) => string
  selectedId: Option<string>
  setSelectedId: (id: Option<string>) => void
  getSelectedItem: () => Promise<Option<T>>

  reset: () => void
}

export type ControllableSearchComponent<T> = React.FunctionComponent<{
  controller: SearchController<T>
}>

export type ModalController = {
  modalOpen: boolean
  setModalOpen: (value: boolean) => void
}

export function useModal(): ModalController {
  const [modalOpen, setModalOpen] = useState(false)

  return { modalOpen, setModalOpen }
}
