import { R } from '@openhome-core/util/functional'
import { SAVClass } from '.'
import { Errorable } from '../../util/functional'
import { SAV } from '../interfaces'
import { PathData } from './path'

export const getPossibleSaveTypes = (
  bytes: Uint8Array,
  supportedSaveTypes: SAVClass[]
): SAVClass[] => {
  const matches = supportedSaveTypes.filter((saveType) => saveType.fileIsSave(bytes))
  const priority = Math.max(0, ...matches.map((saveType) => saveType.detectionPriority ?? 0))
  return matches.filter((saveType) => (saveType.detectionPriority ?? 0) === priority)
}

export const buildUnknownSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  supportedSaveTypes: SAVClass[]
): Errorable<SAV> => {
  const saveTypes = getPossibleSaveTypes(fileBytes, supportedSaveTypes)

  if (saveTypes.length > 1) {
    return R.Err(
      'Could not distinguish between multiple possible save types: ' +
        saveTypes.map((st) => st.saveTypeName).join(', ')
    )
  }

  const saveType = saveTypes.at(0)

  if (!saveType) {
    return R.Err(`Could not detect save type: ${filePath.raw}`)
  }

  return buildSaveFile(filePath, fileBytes, saveType)
}

export const buildSaveFile = (
  filePath: PathData,
  fileBytes: Uint8Array,
  saveType: SAVClass
): Errorable<SAV> => {
  try {
    const saveFile = new saveType(filePath, fileBytes)
    return R.Ok(saveFile)
  } catch (e) {
    return R.Err(String(e))
  }
}
