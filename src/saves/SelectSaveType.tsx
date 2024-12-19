import {
  Button,
  DialogContent,
  DialogTitle,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from '@mui/joy'

interface SelectSaveTypeProps {
  saveTypeNames: string[]
  onSelect: (saveTypeName: string) => void
}

export const SelectSaveType = ({ saveTypeNames, onSelect }: SelectSaveTypeProps) => {
  return (
    <ModalDialog
      sx={{
        minWidth: 400,
        maxWidth: '80%',
        borderRadius: 'lg',
        padding: 2,
      }}
    >
      <ModalClose />
      <DialogTitle>Ambiguous Save Type</DialogTitle>
      <DialogContent>
        <Typography>Select a save type to proceed:</Typography>
        <Stack spacing={2} mt={2}>
          {saveTypeNames.map((plugin, index) => (
            <Button key={index} onClick={() => onSelect(plugin)} variant="soft" color="primary">
              {plugin}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </ModalDialog>
  )
}
