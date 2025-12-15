import { PKMInterface } from '@openhome-core/pkm/interfaces'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { OhpkmLookup } from '@openhome-ui/state/ohpkm'
import * as E from 'fp-ts/lib/Either'
import { SAVClass } from '.'
import { SAV } from '../interfaces'
import { PathData } from './path'

const SKIP_OHPKM_LOAD = false

// check if each pokemon in a save file has OpenHome data associated with it
const recoverOHPKMData = (
  saveFile: SAV,
  getIdentifier: (_: PKMInterface) => string | undefined,
  getOhpkmById?: OhpkmLookup,
  lookupMap?: { [key: string]: string },
  updateMonCallback?: (mon: OHPKM) => void
): SAV => {
  if (!getIdentifier || SKIP_OHPKM_LOAD) {
    return saveFile
  }
  saveFile.boxes.forEach((box) => {
    box.pokemon.forEach((mon, monIndex) => {
      if (mon) {
        const lookupIdentifier = getIdentifier(mon)

        if (!lookupIdentifier) return
        const homeIdentifier = lookupMap ? lookupMap[lookupIdentifier] : lookupIdentifier

        if (!homeIdentifier) return
        const storedOhpkm = getOhpkmById?.(homeIdentifier)

        if (storedOhpkm) {
          storedOhpkm.syncWithGameData(mon, saveFile)
          if (updateMonCallback) {
            updateMonCallback(storedOhpkm)
          }
          box.pokemon[monIndex] = storedOhpkm
        }
      }
    })
  })
  return saveFile
}

export const getPossibleSaveTypes = (
  bytes: Uint8Array,
  supportedSaveTypes: SAVClass[]
): SAVClass[] => {
  return supportedSaveTypes.filter((saveType) => saveType.fileIsSave(bytes))
}

export type MonLookup = {
  getOhpkmById?: OhpkmLookup
  gen12LookupMap?: Record<string, string>
  gen345LookupMap?: Record<string, string>
}

export const buildUnknownSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  lookupMaps: MonLookup,
  supportedSaveTypes: SAVClass[],
  updateMonCallback?: (mon: OHPKM) => void
): E.Either<string, SAV | undefined> => {
  const saveTypes = getPossibleSaveTypes(fileBytes, supportedSaveTypes)

  if (saveTypes.length > 1) {
    return E.left(
      'Could not distinguish between multiple possible save types: ' +
        saveTypes.map((st) => st.saveTypeName).join(', ')
    )
  } else if (saveTypes.length === 0) {
    return E.left('Could not detect save type')
  }
  const saveType = saveTypes[0]

  if (!saveType) return E.right(undefined)

  return buildSaveFile(filePath, fileBytes, lookupMaps, saveType, updateMonCallback)
}

export const buildSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  lookupMaps: MonLookup,
  saveType: SAVClass,
  updateMonCallback?: (mon: OHPKM) => void
): E.Either<string, SAV | undefined> => {
  const { getOhpkmById, gen12LookupMap, gen345LookupMap } = lookupMaps

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

  try {
    const saveFile = recoverOHPKMData(
      new saveType(filePath, fileBytes),
      getIdentifier as (_: PKMInterface) => string | undefined,
      getOhpkmById,
      lookupMap,
      updateMonCallback
    )

    return E.right(saveFile)
  } catch (e) {
    return E.left(`${e}`)
  }
}
