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
