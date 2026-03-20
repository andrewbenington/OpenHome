import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { TagIcon } from '@openhome-ui/components/TagIcon'
import { useSaves } from '@openhome-ui/state/saves'
import { DISPLAY_COLOR_PRESETS, MonTag, TAG_PRESETS } from '@openhome-ui/util/tags'
import { Badge, Button, Card, Flex, Grid, Text, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import useDebounce from 'src/ui/hooks/useDebounce'
import { Typeahead } from '../../components/typeahead'
import { colorIsDark } from '../../util/color'
import './DisplayTab.css'

interface DisplayTabProps {
  mon: OHPKM & {
    displayColor?: string
    tags?: MonTag[]
  }
}

const PRESET_TAG_ICONS = [
  'Circle',
  'Star',
  'Crosshairs',
  'Heart',
  'Thumbs Up',
  'Arrows',
  'Calendar',
] as const

export default function DisplayTab({ mon }: DisplayTabProps) {
  const [customColor, setCustomColor] = useState(mon.displayColor ?? '')
  const [tags, setTags] = useState<MonTag[]>(mon.tags ?? [])

  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState('#888888')
  const [newTagIcon, setNewTagIcon] = useState<string>()

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
      <Flex direction="column" gap="2">
        <Card style={{ padding: 6 }}>
          <Flex gap="1" direction="column" align="start">
            <Flex direction="row" gap="2" align="center">
              <Text as="div" size="2" weight="bold" color="gray" style={{ height: '100%' }}>
                Box Background
              </Text>
              <Button
                className="clear-button"
                size="1"
                highContrast
                variant="surface"
                color="gray"
                onClick={handleClearColor}
                disabled={!customColor}
              >
                Clear
              </Button>
            </Flex>
            <Grid className="color-preset-grid" gap="1" align="center">
              {DISPLAY_COLOR_PRESETS.slice(0, 4).map(({ name, color }) => (
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
              <div className="display-tab-color-input-wrapper">
                Custom
                <input
                  type="color"
                  value={customColor.slice(0, 7) || '#666666'}
                  onChange={(e) => {
                    handleColorChange(e.target.value)
                  }}
                  className="display-tab-color-input"
                />
              </div>
              {DISPLAY_COLOR_PRESETS.slice(4).map(({ name, color }) => (
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
            </Grid>
          </Flex>
        </Card>
        <Card style={{ padding: 8 }}>
          <Flex gap="2" direction="column">
            <Text as="div" size="2" weight="bold" color="gray">
              Add Tags (Max 3)
            </Text>
            <Flex direction="column" gap="3">
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
                  size="1"
                  placeholder="Custom tag name"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  style={{ width: 240 }}
                >
                  <TextField.Slot />
                </TextField.Root>
                <Typeahead
                  uniqueFieldId="icon"
                  placeholder="Icon"
                  options={PRESET_TAG_ICONS}
                  getOptionString={(option) => option}
                  getOptionUniqueID={(option) => option}
                  value={newTagIcon}
                  onChange={(value) => setNewTagIcon(value)}
                  getIconComponent={(icon) => <TagIcon iconName={icon} />}
                  style={{ width: 150 }}
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="display-tab-tag-color-input"
                />
                <Button
                  variant="surface"
                  highContrast
                  color="gray"
                  onClick={() => {
                    handleAddTag({ label: newTagLabel, color: newTagColor, icon: newTagIcon })
                    setNewTagLabel('')
                  }}
                  disabled={!newTagLabel || tags.length >= 3}
                  size="1"
                >
                  Add
                </Button>
              </Flex>
            </Flex>
            <Flex direction="row" gap="2" align="center">
              <Text as="div" size="2" weight="bold" color="gray">
                Current Tags:
              </Text>
              <Button
                className="clear-button"
                variant="surface"
                color="gray"
                highContrast
                size="1"
                onClick={clearAllTags}
              >
                Clear all
              </Button>
            </Flex>
            {tags.length > 0 && (
              <Flex gap="2" wrap="wrap">
                {tags.map((tag) => (
                  <Badge
                    key={tag.label}
                    variant="solid"
                    size="2"
                    className="display-tab-tag-badge"
                    style={{
                      backgroundColor: tag.color,
                      color: colorIsDark(tag.color) ? 'white' : 'black',
                    }}
                    onClick={() => handleRemoveTag(tag.label)}
                    title="Click to remove"
                  >
                    <TagIcon iconName={tag.icon} />
                    {tag.label}
                    <span className="display-tab-tag-remove">×</span>
                  </Badge>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>
      </Flex>
    </div>
  )
}
