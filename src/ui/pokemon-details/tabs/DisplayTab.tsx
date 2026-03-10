import { OHPKM } from '@openhome-core/pkm/OHPKM'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import { useSaves } from '@openhome-ui/state/saves'
import { Button, Flex, TextField } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import useDebounce from 'src/ui/hooks/useDebounce'

// Predefined color options for quick selection
const PRESET_COLORS = [
  { name: 'Red', color: '#ef444480' },
  { name: 'Orange', color: '#f9731680' },
  { name: 'Yellow', color: '#eab30880' },
  { name: 'Green', color: '#22c55e80' },
  { name: 'Blue', color: '#3b82f680' },
  { name: 'Purple', color: '#a855f780' },
  { name: 'Pink', color: '#ec489980' },
  { name: 'Cyan', color: '#06b6d480' },
]

interface DisplayTabProps {
  mon: OHPKM
}

export default function DisplayTab({ mon }: DisplayTabProps) {
  // Use type assertion since displayColor comes from WASM and may not be in TS types yet
  const monWithDisplay = mon as OHPKM & { displayColor?: string }
  const [customColor, setCustomColor] = useState(monWithDisplay.displayColor ?? '')
  const { updateMonDisplayColor } = useSaves()

  useEffect(() => {
    setCustomColor(monWithDisplay.displayColor ?? '')
  }, [mon, monWithDisplay.displayColor])

  const debouncedColorUpdate = useDebounce((color: string) => {
    updateMonDisplayColor(mon.openhomeId, color || undefined)
  }, 300)

  const handleColorChange = (color: string) => {
    setCustomColor(color)
    debouncedColorUpdate(color)
  }

  const handlePresetClick = (color: string) => {
    setCustomColor(color)
    updateMonDisplayColor(mon.openhomeId, color)
  }

  const handleClearColor = () => {
    setCustomColor('')
    updateMonDisplayColor(mon.openhomeId, undefined)
  }

  return (
    <div style={{ padding: 8, height: 'calc(100% - 16px)', overflowY: 'auto' }}>
      <Flex direction="column" gap="3">
        <AttributeRow label="Box Background">
          <Flex direction="column" gap="2" style={{ flex: 1 }}>
            <Flex gap="2" align="center">
              <input
                type="color"
                value={customColor.slice(0, 7) || '#666666'}
                onChange={(e) => {
                  // Add alpha channel for transparency
                  const colorWithAlpha = e.target.value + '80'
                  handleColorChange(colorWithAlpha)
                }}
                style={{
                  width: 40,
                  height: 32,
                  padding: 0,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <TextField.Root
                placeholder="Custom color (e.g., #ff000080)"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                variant="soft"
                color="gray"
                onClick={handleClearColor}
                disabled={!customColor}
              >
                Clear
              </Button>
            </Flex>
          </Flex>
        </AttributeRow>

        <div>
          <div style={{ marginBottom: 8, fontSize: 14, color: '#aaa' }}>Quick Colors</div>
          <Flex wrap="wrap" gap="2">
            {PRESET_COLORS.map(({ name, color }) => (
              <button
                key={name}
                onClick={() => handlePresetClick(color)}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: color,
                  border: customColor === color ? '2px solid white' : '2px solid transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: '#fff',
                  textShadow: '0 0 2px #000',
                }}
                title={name}
              >
                {name}
              </button>
            ))}
          </Flex>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: customColor || '#6662',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 14, textAlign: 'center' }}>
            <div style={{ marginBottom: 4 }}>Preview</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>This is how the box cell will look</div>
          </div>
        </div>
      </Flex>
    </div>
  )
}
