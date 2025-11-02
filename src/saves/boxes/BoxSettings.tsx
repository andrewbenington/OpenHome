import { Button, Dialog, Flex, Separator } from '@radix-ui/themes'
import { useContext, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { OpenSavesContext } from '../../state/openSaves'
import { contrastingTextColor } from '../../util/color'

export type BoxCustomizationProps = {
  homeBoxIndex: number
  open?: boolean
  onClose?: () => void
}

export default function BoxCustomization({ homeBoxIndex, open, onClose }: BoxCustomizationProps) {
  const [openSaves, dispatchOpenSaves] = useContext(OpenSavesContext)
  const homeBox = openSaves.homeData?.boxes[homeBoxIndex]
  const [color, setColor] = useState(homeBox?.customization?.color)

  if (!homeBox) return <div />

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose?.()
      }}
    >
      <Dialog.Content minHeight="400px">
        <Flex gap="2" align="end" p="2">
          <Dialog.Title mb="0">Box Settings</Dialog.Title>
          <Dialog.Description size="4" style={{ textAlign: 'end', flex: 1 }}>
            {homeBox.name} ({homeBoxIndex + 1} / {openSaves.homeData?.boxes.length})
          </Dialog.Description>
        </Flex>
        <Separator style={{ width: '100%' }} />
        <Flex direction="row" gap="2" p="2">
          <HexColorPicker color={color} onChange={setColor} style={{ width: 120, height: 120 }} />
          <Flex direction="column" gap="2">
            <div
              style={{
                backgroundColor: homeBox.customization?.color,
                color: contrastingTextColor(homeBox.customization?.color),
              }}
            >
              Old Color: {homeBox.customization?.color ?? 'None'}
            </div>
            <div style={{ backgroundColor: color, color: contrastingTextColor(color) }}>
              New Color: {color ?? 'None'}
            </div>
            <Button
              size="1"
              onClick={() =>
                dispatchOpenSaves({
                  type: 'set_home_box_color',
                  payload: { index: homeBoxIndex, color },
                })
              }
            >
              Save
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
