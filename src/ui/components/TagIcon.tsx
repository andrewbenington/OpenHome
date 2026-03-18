import {
  FaCalendarAlt,
  FaCircle,
  FaCrosshairs,
  FaExchangeAlt,
  FaHeart,
  FaStar,
  FaThumbsUp,
} from 'react-icons/fa'

export function TagIcon({ iconName, size = 12 }: { iconName?: string; size?: number }) {
  switch (iconName) {
    case 'FaCrosshairs':
      return <FaCrosshairs size={size} />
    case 'FaStar':
      return <FaStar size={size} />
    case 'FaExchangeAlt':
      return <FaExchangeAlt size={size} />
    case 'FaHeart':
      return <FaHeart size={size} />
    case 'FaThumbsUp':
      return <FaThumbsUp size={size} />
    case 'FaCalendarAlt':
      return <FaCalendarAlt size={size} />
    default:
      return <FaCircle size={size} />
  }
}
