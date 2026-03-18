export const TAG_PRESETS = [
  { label: 'Competitive', color: '#ef4444', icon: 'FaCrosshairs' },
  { label: 'Rare', color: '#eab308', icon: 'FaStar' },
  { label: 'Trade', color: '#3b82f6', icon: 'FaExchangeAlt' },
  { label: 'Breeding', color: '#a855f7', icon: 'FaHeart' },
  { label: 'Favorite', color: '#ec4899', icon: 'FaThumbsUp' },
  { label: 'Event', color: '#06b6d4', icon: 'FaCalendarAlt' },
]

export const DISPLAY_COLOR_PRESETS = [
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Cyan', color: '#06b6d4' },
]

export interface MonTag {
  label: string
  color: string
  icon?: string
}
