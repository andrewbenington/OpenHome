export const TAG_PRESETS = [
  { label: 'Competitive', color: '#ef4444' },
  { label: 'Shiny Hunt', color: '#eab308' },
  { label: 'Trade', color: '#3b82f6' },
  { label: 'Breeding', color: '#a855f7' },
  { label: 'Favorite', color: '#ec4899' },
  { label: 'Event', color: '#06b6d4' },
]

export const DISPLAY_COLOR_PRESETS = [
  { name: 'Red', color: '#ef444480' },
  { name: 'Orange', color: '#f9731680' },
  { name: 'Yellow', color: '#eab30880' },
  { name: 'Green', color: '#22c55e80' },
  { name: 'Blue', color: '#3b82f680' },
  { name: 'Purple', color: '#a855f780' },
  { name: 'Pink', color: '#ec489980' },
  { name: 'Cyan', color: '#06b6d480' },
]

export interface MonTag {
  label: string
  color: string
}
