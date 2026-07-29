import { Flex, VisuallyHidden } from '@radix-ui/themes'
import { type CSSProperties } from 'react'

import './style.css'

import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SortableColumn, SortableValue } from '@openhome-core/util/sort'
import useOhpkmColumns from '@openhome-ui/columns/ohpkm'
import { Dialog } from '../dialog/Dialog'
import OhoButton, { OhoButtonType } from '../OhoButton'
import { ModalController, PokemonSearchController, type SearchController } from './controllers'
import Search from './Search'
import './style.css'
import { usePokemonSearch } from './usePokemonSearch'

export interface SearchModalProps<T extends SortableValue, SC extends SearchController<T>> {
  typeName: string
  columns: SortableColumn<T>[]
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
    closeAndClear()
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
          <Dialog.Title>Search Pokémon</Dialog.Title>
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

type PokemonSearchModalProps = Omit<SearchModalProps<OHPKM, PokemonSearchController>, 'columns'>

function PokemonSearchModal(props: PokemonSearchModalProps) {
  const { buttonText, buttonStyle, buttonType, buttonRef, onSelect, modalController } = props
  const searchController = usePokemonSearch()

  return (
    <SearchModal
      typeName="Pokeémon"
      columns={useOhpkmColumns([], () => {})}
      buttonText={buttonText}
      buttonStyle={buttonStyle}
      buttonType={buttonType}
      buttonRef={buttonRef}
      searchController={searchController}
      SearchComponent={Search.Pokemon}
      onSelect={onSelect}
      modalController={modalController}
    />
  )
}

export default PokemonSearchModal
