import { useLocation, useNavigate } from 'react-router'
import { Option } from '../../core/util/functional'

export function usePathSegment(parent: string, defaultVal: string) {
  const navigate = useNavigate()
  const pathname = useLocation().pathname
  const currentSegment = pathname.split(`/${parent}/`).at(1) || defaultVal

  console.log(pathname)
  console.log(
    'Current segment:',
    currentSegment,
    useLocation().pathname.split(`/${parent}/`),
    useLocation().pathname.split(`/${parent}/`).at(1) || defaultVal
  )

  const setCurrentSegment = (newSegment: Option<string>) => {
    console.log('Setting segment to:', newSegment)
    if (pathname.includes(parent)) navigate(`/${parent}/${newSegment || defaultVal}`)
  }

  return { currentSegment, setCurrentSegment }
}
