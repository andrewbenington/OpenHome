import { Option } from '@openhome-core/util/functional'
import { useLocation, useNavigate } from 'react-router'

export function usePathSegment(parent: string, defaultVal: string) {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const currentSegment = pathname.split(`/${parent}/`).at(1) || defaultVal

  const setCurrentSegment = async (newSegment: Option<string>) => {
    if (pathname.includes(parent)) await navigate(`/${parent}/${newSegment || defaultVal}`)
  }

  return { currentSegment, setCurrentSegment }
}
