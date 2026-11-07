import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { SAV } from '@openhome-core/save/interfaces'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import AttributeRowExpand from '@openhome-ui/components/AttributeRowExpand'
import OhoFlex from '@openhome-ui/components/OhoFlex'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { Dialog } from '@radix-ui/themes'

export interface SaveDetailsModalProps {
  save: SAV
  open: boolean
  setOpen: (v: boolean) => void
  setSelectedMon: (mon: PKMInterface) => void
}

export function SaveDetailsModal(props: SaveDetailsModalProps) {
  const { save, open, setOpen, setSelectedMon } = props
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content className="save-details-modal">
        <AttributeRow label="Game">Pokémon {save.gameNameFull}</AttributeRow>
        <AttributeRow label="Trainer Name">{save.name}</AttributeRow>
        <AttributeRow label="Trainer Display ID">{save.displayID}</AttributeRow>
        <AttributeRow label="Trainer Real ID">
          <code>0x{save.tid.toString(16)}</code>
        </AttributeRow>
        {save.sid !== undefined && (
          <AttributeRow label="Secret ID">
            <code>0x{save.sid.toString(16)}</code>
          </AttributeRow>
        )}
        {save.trainerGender !== undefined && (
          <AttributeRow label="Trainer Gender">
            {save.trainerGender ? 'Female' : 'Male'}
          </AttributeRow>
        )}
        <AttributeRow label="File">
          <div style={{ overflowWrap: 'break-word', width: '100%' }}>{save.filePath.raw}</div>
        </AttributeRow>
        {save.fileCreated && (
          <AttributeRow label="File">
            <div style={{ overflowWrap: 'break-word', width: '100%' }}>
              {save.fileCreated.toDateString()}
            </div>
          </AttributeRow>
        )}
        {Object.entries(save.getDisplayData?.() ?? {}).map(([label, value]) => (
          <AttributeRow label={label} key={label}>
            {value}
          </AttributeRow>
        ))}
        <AttributeRowExpand summary="Updated Box Slots" value={save.updatedBoxSlots.length}>
          {save.updatedBoxSlots.map(({ box, boxSlot }, i) => (
            <AttributeRow label={String(i + 1)} key={`${box}-${boxSlot}`}>
              Box {box}, Slot {boxSlot}
            </AttributeRow>
          ))}
        </AttributeRowExpand>
        <OhoFlex.RowCentered>
          {save.getDisplayPkms().map(
            ({ mon, description }) =>
              mon && (
                <AttributeRow label={description} key={description}>
                  <button
                    key={description}
                    onClick={() => {
                      setOpen(false)
                      setSelectedMon(mon)
                    }}
                    className="mon-icon-button"
                  >
                    <PokemonIcon
                      nationalDex={mon.nationalDex}
                      formIndex={mon.formIndex}
                      style={{ height: '1.75rem', width: '1.75rem' }}
                    />
                  </button>
                </AttributeRow>
              )
          )}
        </OhoFlex.RowCentered>
      </Dialog.Content>
    </Dialog.Root>
  )
}
