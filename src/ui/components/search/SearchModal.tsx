import { Flex, VisuallyHidden } from '@radix-ui/themes'
import { type CSSProperties } from 'react'

import './style.css'

import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SortableValue } from '@openhome-core/util/sort'
import { Dialog } from '../dialog/Dialog'
import OhoButton, { OhoButtonType } from '../OhoButton'
import { ModalController, type SearchController } from './controllers'
import Search from './Search'
import './style.css'
import { PokemonSearchController } from './usePokemonSearch'

export interface SearchModalProps<T extends SortableValue, SC extends SearchController<T>> {
  typeName: string
  title?: string
  buttonText?: string
  buttonStyle?: CSSProperties
  buttonType?: OhoButtonType
  buttonRef?: React.Ref<HTMLButtonElement>
  searchController: SC
  SearchComponent: React.FunctionComponent<{ controller: SC }>
  onSelect: (item: T) => void
  modalController: ModalController
}

function SearchModal<T extends SortableValue, SC extends SearchController<T>>(
  props: SearchModalProps<T, SC>
) {
  const {
    typeName,
    title,
    buttonText,
    buttonStyle,
    buttonType,
    buttonRef,
    onSelect,
    searchController,
    SearchComponent,
  } = props
  const { modalOpen, setModalOpen } = props.modalController
  const { selectedItem, reset } = searchController

  function closeAndClear() {
    reset()
    setModalOpen(false)
  }

  function confirmSelected() {
    if (selectedItem) onSelect(selectedItem)
  }

  return (
    <Dialog.Root
      open={modalOpen}
      onOpenChange={(open) => (open ? setModalOpen(true) : closeAndClear())}
    >
      {buttonText && (
        <Dialog.Trigger ref={buttonRef}>
          <OhoButton onClick={() => setModalOpen(true)} style={buttonStyle} type={buttonType}>
            {buttonText}
          </OhoButton>
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="search-dialog-content">
          <Dialog.Title>{title ?? `Search ${typeName}`}</Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>Search and select a {typeName}</Dialog.Description>
          </VisuallyHidden>
          <SearchComponent controller={searchController} />
          <Flex direction="row" gap="2" justify="end" mt="4">
            <OhoButton type="reset" onClick={closeAndClear}>
              Cancel
            </OhoButton>
            <OhoButton disabled={!selectedItem} type="submit" onClick={confirmSelected}>
              Select
            </OhoButton>
          </Flex>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type PokemonSearchModalProps = SearchModalProps<OHPKM, PokemonSearchController>

function PokemonSearchModal(props: PokemonSearchModalProps) {
  return <SearchModal {...props} typeName="Pokémon" SearchComponent={Search.Pokemon} />
}

export default PokemonSearchModal
