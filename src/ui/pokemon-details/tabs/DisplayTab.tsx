import { OHPKM } from '@openhome-core/pkm/OHPKM'
import AttributeRow from '@openhome-ui/components/AttributeRow'
import { TagIcon } from '@openhome-ui/components/TagIcon'
import { useSaves } from '@openhome-ui/state/saves'
import { DISPLAY_COLOR_PRESETS, MonTag, TAG_PRESETS } from '@openhome-ui/util/tags'
import { Badge, Button, Card, Flex, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import useDebounce from 'src/ui/hooks/useDebounce'
import './DisplayTab.css'

interface DisplayTabProps {
  mon: OHPKM & {
    displayColor?: string
    tags?: MonTag[]
  }
}

export default function DisplayTab({ mon }: DisplayTabProps) {
  const [customColor, setCustomColor] = useState(mon.displayColor ?? '')
  const [tags, setTags] = useState<MonTag[]>(mon.tags ?? [])

  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  const [newTagIcon, setNewTagIcon] = useState('FaCircle')

  const { updateMonDisplayColor, updateMonTags } = useSaves()

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

  const handleRemoveTag = (label: string) => {
    const newTags = tags.filter((tag) => tag.label !== label)
    setTags(newTags)
    updateMonTags(mon.openhomeId, newTags.length ? newTags : undefined)
  }

  const clearAllTags = () => {
    setTags([])
    updateMonTags(mon.openhomeId, undefined)
  }

  return (
    <div className="display-tab-root">
      <Flex direction="column" gap="3">
        <AttributeRow label="Box Background">
          <Flex direction="column" gap="2" className="display-tab-flex-fill">
            <Flex gap="2" align="center">
              <input
                type="color"
                value={customColor.slice(0, 7) || '#666666'}
                onChange={(e) => {
                  handleColorChange(e.target.value)
                }}
                className="display-tab-color-input"
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
          <Card className="display-tab-quick-colors-card">
            <Flex wrap="wrap" gap="2">
              {DISPLAY_COLOR_PRESETS.map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => handlePresetClick(color)}
                  className="display-tab-color-preset"
                  style={{
                    backgroundColor: color,
                    borderColor: customColor === color ? 'white' : 'transparent',
                  }}
                  title={name}
                >
                  {name}
                </button>
              ))}
            </Flex>
          </Card>
        </div>

        <div>
          <Text as="div" size="2" weight="bold" color="gray" mb="1">
            Tags (Max 3)
          </Text>

          {tags.length > 0 && (
            <Flex gap="2" wrap="wrap" className="display-tab-tags-selected">
              {tags.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="solid"
                  size="2"
                  className="display-tab-tag-badge"
                  style={{ backgroundColor: tag.color }}
                  onClick={() => handleRemoveTag(tag.label)}
                  title="Click to remove"
                >
                  <TagIcon iconName={tag.icon} />
                  {tag.label}
                  <span className="display-tab-tag-remove">×</span>
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
                  className="display-tab-tag-preset"
                  style={{
                    backgroundColor: preset.color,
                    cursor:
                      tags.length >= 3 || tags.some((t) => t.label === preset.label)
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      tags.length >= 3 || tags.some((t) => t.label === preset.label) ? 0.5 : 1,
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
                className="display-tab-tag-color-input"
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
