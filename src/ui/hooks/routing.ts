import { useLocation, useNavigate } from 'react-router'
import { Option } from '../../core/util/functional'

export function usePathSegment(parent: string, defaultVal: string) {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const currentSegment = pathname.split(`/${parent}/`).at(1) || defaultVal

  const setCurrentSegment = (newSegment: Option<string>) => {
    if (pathname.includes(parent)) navigate(`/${parent}/${newSegment || defaultVal}`)
  }

  return { currentSegment, setCurrentSegment }
}
