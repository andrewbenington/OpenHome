import {
  Button,
  DialogContent,
  DialogTitle,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from '@mui/joy'

interface SelectPluginProps {
  plugins: string[]
  onPluginClick: (plugin: string) => void
}

export const SelectPlugin = ({ plugins, onPluginClick }: SelectPluginProps) => {
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
      <DialogTitle>Complementary Plugins</DialogTitle>
      <DialogContent>
        <Typography>Select a plugin to proceed:</Typography>
        <Stack spacing={2} mt={2}>
          {plugins.map((plugin, index) => (
            <Button
              key={index}
              onClick={() => onPluginClick(plugin)}
              variant="soft"
              color="primary"
            >
              {plugin}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </ModalDialog>
  )
}
