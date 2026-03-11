import { OHPKM } from '@openhome-core/pkm/OHPKM'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import { useSaves } from '@openhome-ui/state/saves'
import { DISPLAY_COLOR_PRESETS, TAG_PRESETS } from '@openhome-ui/util/tags'
import { Badge, Button, Flex, TextField } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import useDebounce from 'src/ui/hooks/useDebounce'

interface DisplayTabProps {
  mon: OHPKM
}

export default function DisplayTab({ mon }: DisplayTabProps) {
  // Use type assertion since displayColor/tagLabel/tagColor come from WASM and may not be in TS types yet
  const monWithDisplay = mon as OHPKM & {
    displayColor?: string
    tagLabel?: string
    tagColor?: string
  }
  const [customColor, setCustomColor] = useState(monWithDisplay.displayColor ?? '')
  const [tagLabel, setTagLabel] = useState(monWithDisplay.tagLabel ?? '')
  const [tagColor, setTagColor] = useState(monWithDisplay.tagColor ?? '')
  const { updateMonDisplayColor, updateMonTag } = useSaves()

  useEffect(() => {
    setCustomColor(monWithDisplay.displayColor ?? '')
    setTagLabel(monWithDisplay.tagLabel ?? '')
    setTagColor(monWithDisplay.tagColor ?? '')
  }, [mon, monWithDisplay.displayColor, monWithDisplay.tagLabel, monWithDisplay.tagColor])

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
    <div
      style={{
        padding: 8,
        height: 'calc(100% - 16px)',
        overflowY: 'auto',
        color: 'var(--gray-12)',
      }}
    >
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
              >
                <TextField.Slot />
              </TextField.Root>
              <Button
                variant="surface"
                color="gray"
                highContrast
                onClick={handleClearColor}
                disabled={!customColor}
              >
                Clear
              </Button>
            </Flex>
          </Flex>
        </AttributeRow>

        <div>
          <div
            style={{ marginBottom: 8, fontSize: 14, fontWeight: 'bold', color: 'var(--gray-a11)' }}
          >
            Quick Colors
          </div>
          <Flex wrap="wrap" gap="2">
            {DISPLAY_COLOR_PRESETS.map(({ name, color }) => (
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
            border: '1px solid var(--gray-a5)',
          }}
        >
          <div style={{ fontSize: 14, textAlign: 'center', color: 'var(--gray-12)' }}>
            <div style={{ marginBottom: 4, fontWeight: 'bold' }}>Preview</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>This is how the box cell will look</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div
            style={{ marginBottom: 8, fontSize: 14, fontWeight: 'bold', color: 'var(--gray-a11)' }}
          >
            Custom Tag
          </div>
          <Flex direction="column" gap="2">
            <Flex gap="2" wrap="wrap">
              {TAG_PRESETS.map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => {
                    setTagLabel(label)
                    setTagColor(color)
                    updateMonTag(mon.openhomeId, label, color)
                  }}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: color,
                    border: tagLabel === label ? '2px solid white' : '2px solid transparent',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: '#fff',
                    textShadow: '0 0 2px #000',
                  }}
                  title={label}
                >
                  {label}
                </button>
              ))}
            </Flex>
            <Flex gap="2" align="center">
              <TextField.Root
                placeholder="Custom tag name"
                value={tagLabel}
                onChange={(e) => setTagLabel(e.target.value)}
                style={{ flex: 1 }}
              >
                <TextField.Slot />
              </TextField.Root>
              <input
                type="color"
                value={tagColor || '#888888'}
                onChange={(e) => setTagColor(e.target.value)}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <Button
                variant="surface"
                highContrast
                onClick={() =>
                  updateMonTag(mon.openhomeId, tagLabel || undefined, tagColor || undefined)
                }
                disabled={!tagLabel}
              >
                Apply
              </Button>
              <Button
                variant="surface"
                color="gray"
                highContrast
                onClick={() => {
                  setTagLabel('')
                  setTagColor('')
                  updateMonTag(mon.openhomeId, undefined, undefined)
                }}
                disabled={!tagLabel && !tagColor}
              >
                Clear
              </Button>
            </Flex>
            {tagLabel && (
              <Flex align="center" gap="2">
                <span style={{ fontSize: 12, color: 'var(--gray-11)' }}>Preview:</span>
                <Badge
                  variant="solid"
                  size="1"
                  style={{
                    backgroundColor: tagColor || '#888',
                    color: '#fff',
                  }}
                >
                  {tagLabel}
                </Badge>
              </Flex>
            )}{' '}
          </Flex>
        </div>
      </Flex>
    </div>
  )
}
