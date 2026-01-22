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
import { getMonFileIdentifier, OhpkmIdentifier } from '../../../core/pkm/Lookup'
import { SAV } from '../../../core/save/interfaces'
import { RR_TRANSFER_RESTRICTIONS } from '../../../core/save/radicalred/G3RRSAV'
import { UB_TRANSFER_RESTRICTIONS } from '../../../core/save/unbound/G3UBSAV'
import { buildUnknownSaveFile } from '../../../core/save/util/load'
import { isRestricted, TransferRestrictions } from '../../../core/save/util/TransferRestrictions'
import { R } from '../../../core/util/functional'
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
  const [findingSaveState, setFindingSaveState] = useState<FindingSaveState>()

  const enabledSaveTypes = useMemo(getEnabledSaveTypes, [getEnabledSaveTypes])

  const findSaveForMon = useCallback(
    async (identifier: OhpkmIdentifier) => {
      const mon = ohpkmStore.getById(identifier)
      if (!mon) {
        console.error('mon not tracked!')

        setFindingSaveState({ state: 'error', error: `Pokémon not found: ${identifier}` })
        return
      }

      setFindingSaveState({ state: 'getting_recent_saves' })
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
        setFindingSaveState({
          state: 'finding',
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
        }

        const match = saveFile.value?.boxes
          .flatMap((b) => b.boxSlots)
          .find((boxSlot) => boxSlot && getMonFileIdentifier(boxSlot) === identifier)

        if (match && saveFile.value) {
          setFindingSaveState({ state: 'found', save: saveFile.value })

          mon.syncWithGameData(match, saveFile.value)
          ohpkmStore.insertOrUpdate(mon)
          return savePath
        }

        setFindingSaveState({ state: 'not_found' })
      }
    },
    [backend, displayError, enabledSaveTypes, ohpkmStore]
  )

  return {
    findSaveForMon,
    findingSaveState,
    clearFindingState: () => setFindingSaveState(undefined),
  }
}

export type FindingSaveState =
  | { state: 'getting_recent_saves' }
  | {
      state: 'finding'
      currentSavePath: string
      currentIndex: number
      totalSaves: number
    }
  | { state: 'found'; save: SAV }
  | { state: 'not_found' }
  | { state: 'error'; error: string }

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
