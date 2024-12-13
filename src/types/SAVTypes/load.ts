import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from 'src/util/Lookup'
import { PKMInterface } from '../interfaces'
import { OHPKM } from '../pkm/OHPKM'
import { PathData } from './path'
import { SAV } from './SAV'
import { SAVClass } from './util'

// check if each pokemon in a save file has OpenHome data associated with it
const recoverOHPKMData = (
  saveFile: SAV,
  getIdentifier: (_: PKMInterface) => string | undefined,
  homeMonMap?: { [key: string]: OHPKM },
  lookupMap?: { [key: string]: string },
  updateMonCallback?: (mon: OHPKM) => void
): SAV => {
  if (!homeMonMap || !getIdentifier) {
    return saveFile
  }
  saveFile.boxes.forEach((box) => {
    box.pokemon.forEach((mon, monIndex) => {
      if (mon) {
        const lookupIdentifier = getIdentifier(mon)

        if (!lookupIdentifier) return
        const homeIdentifier = lookupMap ? lookupMap[lookupIdentifier] : lookupIdentifier

        if (!homeIdentifier) return
        const result = Object.entries(homeMonMap).find((entry) => entry[0] === homeIdentifier)

        if (result) {
          const updatedOHPKM = result[1]

          updatedOHPKM.updateData(mon)
          if (updateMonCallback) {
            updateMonCallback(updatedOHPKM)
          }
          box.pokemon[monIndex] = updatedOHPKM
        }
      }
    })
  })
  return saveFile
}

export const getSaveType = (
  bytes: Uint8Array,
  supportedSaveTypes: SAVClass[]
): SAVClass | undefined => {
  for (const saveType of supportedSaveTypes) {
    if (saveType.fileIsSave(bytes)) {
      return saveType
    }
  }
  return undefined
}

export const buildSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  lookupMaps: {
    homeMonMap?: Record<string, OHPKM>
    gen12LookupMap?: Record<string, string>
    gen345LookupMap?: Record<string, string>
    fileCreatedDate?: Date
  },
  supportedSaveTypes: SAVClass[],
  updateMonCallback?: (mon: OHPKM) => void
): SAV | undefined => {
  const { homeMonMap, gen12LookupMap, gen345LookupMap } = lookupMaps
  const saveType = getSaveType(fileBytes, supportedSaveTypes)

  if (!saveType) return undefined

  const lookupMap =
    saveType.lookupType === 'gen12'
      ? gen12LookupMap
      : saveType.lookupType === 'gen345'
        ? gen345LookupMap
        : undefined

  const getIdentifier =
    saveType.lookupType === 'gen12'
      ? getMonGen12Identifier
      : saveType.lookupType === 'gen345'
        ? getMonGen345Identifier
        : getMonFileIdentifier

  const saveFile = recoverOHPKMData(
    new saveType(filePath, fileBytes),
    getIdentifier as (_: PKMInterface) => string | undefined,
    homeMonMap,
    lookupMap,
    updateMonCallback
  )

  return saveFile
}
