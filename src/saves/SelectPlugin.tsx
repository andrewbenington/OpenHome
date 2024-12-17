import {
  Button,
  DialogContent,
  DialogTitle,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from '@mui/joy'
import { SAVClass } from 'src/types/SAVTypes/util'

export function waitForPluginSelection(
  setSpecifySave: React.Dispatch<
    React.SetStateAction<{
      supportedSaveTypes: SAVClass[]
      plugins: string[]
      onSelect?: (plugin: string) => void
    } | null>
  >
): Promise<SAVClass | undefined> {
  return new Promise((resolve) => {
    setSpecifySave((prevState) => {
      if (!prevState) {
        throw new Error('SpecifySave state is unexpectedly null.')
      }

      return {
        ...prevState,
        onSelect: (selectedPlugin: string) => {
          resolve(prevState.supportedSaveTypes.find((item) => item.saveTypeID === selectedPlugin))
          setSpecifySave(null) // Close the modal after selection
        },
      }
    })
  })
}

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
        zIndex: 2000, // High zIndex to overlay it over everything
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
