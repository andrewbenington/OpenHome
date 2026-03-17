import { OHPKM } from '@openhome-core/pkm/OHPKM'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import { TagIcon } from '@openhome-ui/components/TagIcon'
import { useSaves } from '@openhome-ui/state/saves'
import { DISPLAY_COLOR_PRESETS, MonTag, TAG_PRESETS } from '@openhome-ui/util/tags'
import { Badge, Button, Flex, Text, TextField } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import useDebounce from 'src/ui/hooks/useDebounce'

interface DisplayTabProps {
  mon: OHPKM
}

export default function DisplayTab({ mon }: DisplayTabProps) {
  const monWithDisplay = mon as OHPKM & {
    displayColor?: string
    tags?: MonTag[]
  }
  const [customColor, setCustomColor] = useState(monWithDisplay.displayColor ?? '')
  const [tags, setTags] = useState<MonTag[]>(monWithDisplay.tags ?? [])

  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  const [newTagIcon, setNewTagIcon] = useState('FaCircle')

  const { updateMonDisplayColor, updateMonTags } = useSaves()

  const tagsString = JSON.stringify(monWithDisplay.tags)

  useEffect(() => {
    setCustomColor(monWithDisplay.displayColor ?? '')
    setTags(monWithDisplay.tags ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mon.openhomeId, monWithDisplay.displayColor, tagsString])

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

  const handleAddTag = (tag: MonTag) => {
    if (tags.some((t) => t.label === tag.label) || tags.length >= 3) return
    const newTags = [...tags, tag]
    setTags(newTags)
    updateMonTags(mon.openhomeId, newTags)
  }

  const handleRemoveTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    setTags(newTags)
    updateMonTags(mon.openhomeId, newTags.length ? newTags : undefined)
  }

  const clearAllTags = () => {
    setTags([])
    updateMonTags(mon.openhomeId, undefined)
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
          <Text as="div" size="2" weight="bold" color="gray" mb="1">
            Quick Colors
          </Text>
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

        <div>
          <Text as="div" size="2" weight="bold" color="gray" mb="1">
            Tags (Max 3)
          </Text>

          {tags.length > 0 && (
            <Flex gap="2" wrap="wrap" style={{ marginBottom: 10 }}>
              {tags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="solid"
                  size="2"
                  style={{
                    backgroundColor: tag.color,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onClick={() => handleRemoveTag(i)}
                  title="Click to remove"
                >
                  <TagIcon iconName={tag.icon} />
                  {tag.label}
                  <span style={{ opacity: 0.7 }}>×</span>
                </Badge>
              ))}
              <Button variant="surface" color="red" highContrast size="1" onClick={clearAllTags}>
                Clear all
              </Button>
            </Flex>
          )}

          <Flex direction="column" gap="2">
            <Flex gap="2" wrap="wrap">
              {TAG_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleAddTag(preset)}
                  disabled={tags.length >= 3}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: preset.color,
                    border: '2px solid transparent',
                    borderRadius: 6,
                    cursor:
                      tags.length >= 3 || tags.some((t) => t.label === preset.label)
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      tags.length >= 3 || tags.some((t) => t.label === preset.label) ? 0.5 : 1,
                    fontSize: 12,
                    color: '#fff',
                    textShadow: '0 0 2px #000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={preset.label}
                >
                  <TagIcon iconName={preset.icon} size={10} />
                  {preset.label}
                </button>
              ))}
            </Flex>

            <Flex gap="2" align="center">
              <TextField.Root
                placeholder="Custom tag name"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                style={{ flex: 1 }}
              >
                <TextField.Slot />
              </TextField.Root>
              <select
                value={newTagIcon}
                onChange={(e) => setNewTagIcon(e.target.value)}
                className="rt-reset rt-SelectTrigger rt-r-size-1 rt-variant-surface"
                style={{ minWidth: 100 }}
              >
                <option value="FaCircle">Circle</option>
                <option value="FaStar">Star</option>
                <option value="FaCrosshairs">Crosshairs</option>
                <option value="FaHeart">Heart</option>
                <option value="FaThumbsUp">Thumbs Up</option>
                <option value="FaExchangeAlt">Trade</option>
                <option value="FaCalendarAlt">Calendar</option>
              </select>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
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
                onClick={() => {
                  handleAddTag({ label: newTagLabel, color: newTagColor, icon: newTagIcon })
                  setNewTagLabel('')
                }}
                disabled={!newTagLabel || tags.length >= 3}
              >
                Add
              </Button>
            </Flex>
          </Flex>
        </div>
      </Flex>
    </div>
  )
}
