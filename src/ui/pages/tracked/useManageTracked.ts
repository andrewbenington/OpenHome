import { GameSetting, Generation, OriginGame, OriginGames } from '@pkm-rs/pkg'
import { useCallback, useContext, useMemo, useState } from 'react'
import {
  BDSP_TRANSFER_RESTRICTIONS,
  BW2_TRANSFER_RESTRICTIONS,
  GEN1_TRANSFER_RESTRICTIONS,
  GEN2_TRANSFER_RESTRICTIONS,
  GEN3_TRANSFER_RESTRICTIONS,
  HGSS_TRANSFER_RESTRICTIONS,
  LA_TRANSFER_RESTRICTIONS,
  LGPE_TRANSFER_RESTRICTIONS,
  ORAS_TRANSFER_RESTRICTIONS,
  SV_TRANSFER_RESTRICTIONS_ID,
  SWSH_TRANSFER_RESTRICTIONS_CT,
  USUM_TRANSFER_RESTRICTIONS,
} from '../../../../packages/pokemon-resources/src/consts/TransferRestrictions'
import { PKMInterface } from '../../../core/pkm/interfaces'
import { getMonFileIdentifier, OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { BoxAndSlot, SAV } from '../../../core/save/interfaces'
import { RR_TRANSFER_RESTRICTIONS } from '../../../core/save/radicalred/G3RRSAV'
import { UB_TRANSFER_RESTRICTIONS } from '../../../core/save/unbound/G3UBSAV'
import { buildUnknownSaveFile } from '../../../core/save/util/load'
import { isRestricted, TransferRestrictions } from '../../../core/save/util/TransferRestrictions'
import { Option, R, range } from '../../../core/util/functional'
import { filterUndefined } from '../../../core/util/sort'
import { SaveRef } from '../../../core/util/types'
import { BackendContext } from '../../backend/backendContext'
import useDisplayError from '../../hooks/displayError'
import { AppInfoContext } from '../../state/appInfo'
import { useOhpkmStore } from '../../state/ohpkm'

export function useManageTracked() {
  const ohpkmStore = useOhpkmStore()
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()
  const [findingSaveState, setFindingSaveState] = useState<FindingSavesState>()

  const enabledSaveTypes = useMemo(getEnabledSaveTypes, [getEnabledSaveTypes])

  const findSaveForMon = useCallback(
    async (identifier: OhpkmIdentifier) => {
      function setState(state: FindingSaveForOneState) {
        setFindingSaveState({ type: 'finding_one', state })
      }

      const mon = ohpkmStore.getById(identifier)
      if (!mon) {
        console.error('mon not tracked!')

        setState({ type: 'error', error: `Pokémon not found: ${identifier}` })
        return
      }

      setState({ type: 'getting_recent_saves' })
      const savePaths = await backend.getRecentSaves().then(
        R.map((saves) =>
          Object.values(saves)
            .filter((s) => monPossiblySupported(mon.dexNum, mon.formeNum, s))
            .map((s) => s.filePath)
        )
      )

      if (R.isErr(savePaths)) {
        displayError('Get Recent Saves', savePaths.err)
        return
      }

      for (const [i, savePath] of savePaths.value.entries()) {
        setState({
          type: 'finding',
          currentSavePath: savePath.raw,
          currentIndex: i + 1,
          totalSaves: savePaths.value.length,
        })

        const saveFileBytes = await backend.loadSaveFile(savePath)
        if (R.isErr(saveFileBytes)) {
          console.error(`could not open save file ${savePath.raw}: ${saveFileBytes.err}`)
          continue
        }

        const saveFile = buildUnknownSaveFile(
          savePath,
          saveFileBytes.value.fileBytes,
          enabledSaveTypes
        )

        if (R.isErr(saveFile)) {
          console.error(`could not build save file ${savePath.raw}: ${saveFile.err}`)
          continue
        } else if (!saveFile.value) {
          console.error(`could not build save file ${savePath.raw}: result is undefined`)
          continue
        }

        const searchResult = searchSaveForMon(saveFile.value, identifier)
        if (!searchResult) {
          continue
        }

        const { match, location } = searchResult

        if (match && saveFile.value) {
          setState({ type: 'found', save: saveFile.value, location })

          mon.syncWithGameData(match, saveFile.value)
          ohpkmStore.insertOrUpdate(mon)
          return saveFile.value
        }
      }

      setState({ type: 'not_found' })
    },
    [backend, displayError, enabledSaveTypes, ohpkmStore]
  )

  const findSavesForAllMons = useCallback(async () => {
    function setState(state: FindingSavesForAllState) {
      setFindingSaveState({ type: 'finding_all', state })
    }

    const result = await backend.getRecentSaves().then(R.map((saves) => Object.values(saves)))

    if (R.isErr(result)) {
      displayError('Get Recent Saves', result.err)
      return
    }

    const allStoredById = ohpkmStore.byId
    const totalMons = Object.keys(allStoredById).length
    let foundMonIds = new Set<string>()

    const saveRefs = result.value

    for (const [i, saveRef] of saveRefs.entries()) {
      setState({
        type: 'checking_save',
        currentSaveRef: saveRef,
        currentIndex: i + 1,
        totalSaves: saveRefs.length,
        foundMons: foundMonIds.size,
        totalMons,
      })

      const savePath = saveRef.filePath

      const saveFileBytes = await backend.loadSaveFile(savePath)
      if (R.isErr(saveFileBytes)) {
        console.error(`could not open save file ${savePath.raw}: ${saveFileBytes.err}`)
        continue
      }

      const result = buildUnknownSaveFile(savePath, saveFileBytes.value.fileBytes, enabledSaveTypes)

      if (R.isErr(result)) {
        console.error(`could not build save file ${savePath.raw}: ${result.err}`)
        continue
      } else if (!result.value) {
        continue
      }

      const save = result.value
      for (const saveMon of save.boxes.flatMap((b) => b.boxSlots).filter(filterUndefined)) {
        const saveMonId = getMonFileIdentifier(saveMon)
        if (saveMonId === undefined || foundMonIds.has(saveMonId)) continue

        const trackedMon = allStoredById[saveMonId]
        if (trackedMon) {
          trackedMon.syncWithGameData(saveMon, save)
          ohpkmStore.insertOrUpdate(trackedMon)
          foundMonIds.add(saveMonId)
        }
      }
    }

    setState({ type: 'complete', foundMons: foundMonIds.size, totalMons })
  }, [backend, displayError, enabledSaveTypes, ohpkmStore])

  return {
    findSaveForMon,
    findSavesForAllMons,
    findingSaveState,
    clearFindingState: () => setFindingSaveState(undefined),
  }
}

export type FindingSavesState =
  | { type: 'finding_one'; state: FindingSaveForOneState }
  | { type: 'finding_all'; state: FindingSavesForAllState }

export type FindingSaveForOneState =
  | { type: 'getting_recent_saves' }
  | { type: 'finding'; currentSavePath: string; currentIndex: number; totalSaves: number }
  | { type: 'found'; save: SAV; location: BoxAndSlot }
  | { type: 'not_found' }
  | { type: 'error'; error: string }

export type FindingSavesForAllState =
  | {
      type: 'checking_save'
      currentSaveRef: SaveRef
      currentIndex: number
      totalSaves: number
      foundMons: number
      totalMons: number
    }
  | { type: 'complete'; foundMons: number; totalMons: number }
  | { type: 'error'; error: string }

function monPossiblySupported(dexNumber: number, formeNumber: number, saveRef: SaveRef) {
  if (saveRef.game === null) return false

  function isSupported(restrictions: TransferRestrictions) {
    return !isRestricted(restrictions, dexNumber, formeNumber)
  }

  if (saveRef.pluginIdentifier === 'radical_red') {
    return isSupported(RR_TRANSFER_RESTRICTIONS)
  } else if (saveRef.pluginIdentifier === 'unbound') {
    return isSupported(UB_TRANSFER_RESTRICTIONS)
  }

  switch (OriginGames.generation(saveRef.game)) {
    case Generation.G1:
      return isSupported(GEN1_TRANSFER_RESTRICTIONS)
    case Generation.G2:
      return isSupported(GEN2_TRANSFER_RESTRICTIONS)
    case Generation.G3:
      return isSupported(GEN3_TRANSFER_RESTRICTIONS)
    case Generation.G4:
      return isSupported(HGSS_TRANSFER_RESTRICTIONS)
    case Generation.G5:
      return isSupported(BW2_TRANSFER_RESTRICTIONS)
    case Generation.G6:
      return isSupported(ORAS_TRANSFER_RESTRICTIONS)
    case Generation.G7:
      return isSupported(
        OriginGames.isLetsGo(saveRef.game) ? LGPE_TRANSFER_RESTRICTIONS : USUM_TRANSFER_RESTRICTIONS
      )
    default:
      if (OriginGames.region(saveRef.game) === GameSetting.Galar) {
        return isSupported(SWSH_TRANSFER_RESTRICTIONS_CT)
      } else if (saveRef.game === OriginGame.LegendsArceus) {
        return isSupported(LA_TRANSFER_RESTRICTIONS)
      } else if (OriginGames.isBdsp(saveRef.game)) {
        return isSupported(BDSP_TRANSFER_RESTRICTIONS)
      } else if (OriginGames.isScarletViolet(saveRef.game)) {
        return isSupported(SV_TRANSFER_RESTRICTIONS_ID)
      }
  }
}

function searchSaveForMon(save: SAV, id: OhpkmIdentifier): Option<SaveSearchResult> {
  for (const boxIndex of range(save.boxes.length)) {
    const box = save.boxes[boxIndex]
    for (const boxSlot of range(box.boxSlots.length)) {
      const mon = box.boxSlots[boxSlot]
      if (mon && getMonFileIdentifier(mon) === id) {
        return {
          match: mon,
          location: { box: boxIndex, boxSlot },
        }
      }
    }
  }
}

type SaveSearchResult = {
  match: PKMInterface
  location: BoxAndSlot
}
