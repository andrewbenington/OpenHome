import { PKMInterface } from '@openhome-core/pkm/interfaces'
import {
  getMonFileIdentifier,
  getMonGen12Identifier,
  getMonGen345Identifier,
} from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { R } from '@openhome-core/util/functional'
import { OhpkmLookup } from '@openhome-ui/state/ohpkm'
import { SAVClass } from '.'
import { NationalDex } from '../../../../packages/pokemon-resources/src/consts/NationalDex'
import { EmptyTracker, OhpkmTracker } from '../../../tracker'
import { Errorable } from '../../util/functional'
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
    box.boxSlots.forEach((mon) => {
      if (mon) {
        if (mon.data.dexNum === NationalDex.Arbok) {
          console.log('arbok')
        }
        try {
          const lookupIdentifier = getIdentifier(mon.data)

          if (!lookupIdentifier) return
          const homeIdentifier = lookupMap ? lookupMap[lookupIdentifier] : lookupIdentifier

          if (!homeIdentifier) return
          const storedOhpkm = getOhpkmById?.(homeIdentifier)

          if (storedOhpkm) {
            storedOhpkm.syncWithGameData(mon.data, saveFile)
            updateMonCallback?.(storedOhpkm)
          }
        } catch (e) {
          console.error('Error recovering OHPKM data for mon:', mon, e)
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
  tracker?: OhpkmTracker,
  updateMonCallback?: (mon: OHPKM) => void
): Errorable<SAV | undefined> => {
  const saveTypes = getPossibleSaveTypes(fileBytes, supportedSaveTypes)

  if (saveTypes.length > 1) {
    return R.Err(
      'Could not distinguish between multiple possible save types: ' +
        saveTypes.map((st) => st.saveTypeName).join(', ')
    )
  } else if (saveTypes.length === 0) {
    return R.Err('Could not detect save type')
  }
  const saveType = saveTypes[0]

  if (!saveType) return R.Ok(undefined)

  return buildSaveFile(
    filePath,
    fileBytes,
    lookupMaps,
    saveType,
    tracker ?? EmptyTracker(),
    updateMonCallback
  )
}

export const buildSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  lookupMaps: MonLookup,
  saveType: SAVClass,
  tracker: OhpkmTracker,
  updateMonCallback?: (mon: OHPKM) => void
): Errorable<SAV | undefined> => {
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
      new saveType(filePath, fileBytes, tracker),
      getIdentifier as (_: PKMInterface) => string | undefined,
      getOhpkmById,
      lookupMap,
      updateMonCallback
    )

    return R.Ok(saveFile)
  } catch (e) {
    return R.Err(String(e))
  }
}
