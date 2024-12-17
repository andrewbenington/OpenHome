import { Box, Button, ModalDialog, Typography } from '@mui/joy'

interface SaveNotFoundErrorProps {
  onClose: () => void
}

const SaveNotFoundError = ({ onClose }: SaveNotFoundErrorProps) => {
  return (
    <ModalDialog
      sx={{
        minWidth: 800,
        width: '35%',
        maxHeight: 'fit-content',
        height: '95vh',
        overflow: 'hidden',
        borderRadius: 8,
        padding: 2,
        zIndex: 2000, // High zIndex to overlay it over everything
      }}
    >
      <Box>
        <Typography sx={{ mb: 2 }}>Error Identifing The Correct Save</Typography>
        <Typography>
          {' '}
          {/* TODO Better Error Message */}
          Check if you are opening the correct save, also make sure file bytes match.
        </Typography>
        <Button onClick={onClose} variant="soft" color="primary" sx={{ mt: 3, width: '100%' }}>
          Close
        </Button>
      </Box>
    </ModalDialog>
  )
}

export default SaveNotFoundError
