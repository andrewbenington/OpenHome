import { Dispatch, Reducer, createContext } from 'react'
import { G3RRSAV } from 'src/types/SAVTypes/radicalred/G3RRSAV'
import { G1SAV } from '../../types/SAVTypes/G1SAV'
import { G2SAV } from '../../types/SAVTypes/G2SAV'
import { G3SAV } from '../../types/SAVTypes/G3SAV'
import { DPSAV } from '../../types/SAVTypes/GEN4/DPSAV'
import { HGSSSAV } from '../../types/SAVTypes/GEN4/HGSSSAV'
import { PtSAV } from '../../types/SAVTypes/GEN4/PtSAV'
import { BW2SAV } from '../../types/SAVTypes/GEN5/BW2SAV'
import { BWSAV } from '../../types/SAVTypes/GEN5/BWSAV'
import { ORASSAV } from '../../types/SAVTypes/GEN6/ORASSAV'
import { XYSAV } from '../../types/SAVTypes/GEN6/XYSAV'
import { SMSAV } from '../../types/SAVTypes/GEN7/SMSAV'
import { USUMSAV } from '../../types/SAVTypes/GEN7/USUMSAV'
import { SAVClass } from '../../types/SAVTypes/util'

export type Settings = {
  enabledSaveTypes: Record<string, boolean>
  officialSaveTypes: SAVClass[]
  extraSaveTypes: SAVClass[]
}

export type AppInfoState = {
  resourcesPath?: string
  settings: Settings
}

export type AppInfoAction =
  | {
      type: 'set_resources_path'
      payload: string
    }
  | {
      type: 'set_savetype_enabled'
      payload: {
        saveType: SAVClass
        enabled: boolean
      }
    }

export const appInfoReducer: Reducer<AppInfoState, AppInfoAction> = (
  state: AppInfoState,
  action: AppInfoAction
) => {
  const { type, payload } = action
  switch (type) {
    case 'set_resources_path': {
      return {
        ...state,
        resourcesPath: payload,
      }
    }
    case 'set_savetype_enabled': {
      const enabled = state.settings.enabledSaveTypes
      if (payload.enabled) {
        enabled[payload.saveType.name] = true
      } else {
        enabled[payload.saveType.name] = false
      }
      return { ...state, settings: { ...state.settings, enabledSaveTypes: enabled } }
    }
  }
}

export const appInfoInitialState: AppInfoState = {
  settings: {
    officialSaveTypes: [
      G1SAV,
      G2SAV,
      G3SAV,
      DPSAV,
      PtSAV,
      HGSSSAV,
      BWSAV,
      BW2SAV,
      XYSAV,
      ORASSAV,
      SMSAV,
      USUMSAV,
    ],
    extraSaveTypes: [G3RRSAV],
    enabledSaveTypes: Object.fromEntries(
      [
        G1SAV,
        G2SAV,
        G3SAV,
        DPSAV,
        PtSAV,
        HGSSSAV,
        BWSAV,
        BW2SAV,
        XYSAV,
        ORASSAV,
        SMSAV,
        USUMSAV,
        G3RRSAV,
      ].map((savetype) => [savetype.name, true])
    ),
  },
}

export const AppInfoContext = createContext<
  [AppInfoState, Dispatch<AppInfoAction>, () => SAVClass[]]
>([appInfoInitialState, () => null, () => []])
