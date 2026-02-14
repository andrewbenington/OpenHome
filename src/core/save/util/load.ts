import { R } from '@openhome-core/util/functional'
import { OhpkmLookup } from '@openhome-ui/state/ohpkm'
import { SAVClass } from '.'
import { Errorable } from '../../util/functional'
import { SAV } from '../interfaces'
import { PathData } from './path'

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
  supportedSaveTypes: SAVClass[]
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

  return buildSaveFile(filePath, fileBytes, saveType)
}

export const buildSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  saveType: SAVClass
): Errorable<SAV | undefined> => {
  try {
    const saveFile = new saveType(filePath, fileBytes)
    return R.Ok(saveFile)
  } catch (e) {
    return R.Err(String(e))
  }
}
