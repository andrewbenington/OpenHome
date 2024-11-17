import { useContext } from 'react'
import { PKMInterface } from '../../types/interfaces'
import { AppInfoContext } from '../state/appInfo'

export const getPublicImageURL = (path: string): string => {
  const urlPath = `../${path}`
  return new URL(urlPath, import.meta.url).href
}

export const getTypeIconPath = (type: string): string => {
  return `types/${type.toLowerCase()}.png`
}

export function useMonSaveLogo(mon: PKMInterface) {
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  if (mon.pluginIdentifier) {
    getEnabledSaveTypes().find((saveType) => saveType)
  }
}
