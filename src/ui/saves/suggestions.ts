import { SAV } from '@openhome-core/save/interfaces'
import { PathData } from '@openhome-core/save/util/path'
import { Errorable } from '@openhome-core/util/functional'

export type SaveSuggestion = {
  save: Errorable<SAV>
  filePath: PathData
}

export type LoadingSaveSuggestion = {
  loadingSave: Promise<Errorable<SAV>>
  filePath: PathData
}

export function isLoaded(
  suggestion: LoadingSaveSuggestion | SaveSuggestion
): suggestion is SaveSuggestion {
  return 'save' in suggestion
}
