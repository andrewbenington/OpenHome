import { IconType } from 'react-icons'
import {
  FaCalendarAlt,
  FaCircle,
  FaCrosshairs,
  FaExchangeAlt,
  FaHeart,
  FaStar,
  FaThumbsUp,
} from 'react-icons/fa'

const TAG_ICONS: Record<string, IconType> = {
  Circle: FaCircle,
  Star: FaStar,
  Crosshairs: FaCrosshairs,
  Heart: FaHeart,
  'Thumbs Up': FaThumbsUp,
  Arrows: FaExchangeAlt,
  Calendar: FaCalendarAlt,
}

export function TagIcon({ iconName, size = 12 }: { iconName?: string; size?: number }) {
  const IconComponent = TAG_ICONS[iconName as keyof typeof TAG_ICONS]
  if (IconComponent) {
    return <IconComponent style={{ width: size, height: size }} />
  }
}
