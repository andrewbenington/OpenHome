import { Dispatch, Reducer, createContext } from 'react'
import { BW2SAV } from 'src/core/save/BW2SAV'
import { BWSAV } from 'src/core/save/BWSAV'
import { DPSAV } from 'src/core/save/DPSAV'
import { G1SAV } from 'src/core/save/G1SAV'
import { G2SAV } from 'src/core/save/G2SAV'
import { G3SAV } from 'src/core/save/G3SAV'
import { BDSPSAV } from 'src/core/save/Gen89/BDSPSAV'
import { LASAV } from 'src/core/save/Gen89/LASAV'
import { SVSAV } from 'src/core/save/Gen89/SVSAV'
import { SwShSAV } from 'src/core/save/Gen89/SwShSAV'
import { HGSSSAV } from 'src/core/save/HGSSSAV'
import { LGPESAV } from 'src/core/save/LGPESAV'
import { ORASSAV } from 'src/core/save/ORASSAV'
import { PtSAV } from 'src/core/save/PtSAV'
import { G3RRSAV } from 'src/core/save/radicalred/G3RRSAV'
import { SMSAV } from 'src/core/save/SMSAV'
import { G3UBSAV } from 'src/core/save/unbound/G3UBSAV'
import { USUMSAV } from 'src/core/save/USUMSAV'
import { SAVClass } from 'src/core/save/util/util'
import { XYSAV } from 'src/core/save/XYSAV'
import { SaveViewMode } from '../saves/util'

const OFFICIAL_SAVE_TYPES = [
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
  LGPESAV,
  SwShSAV,
  BDSPSAV,
  LASAV,
  SVSAV,
]
const EXTRA_SAVE_TYPES = [G3RRSAV, G3UBSAV]

export const defaultSettings: Settings = {
  enabledSaveTypes: Object.fromEntries(
    [...OFFICIAL_SAVE_TYPES, ...EXTRA_SAVE_TYPES].map((savetype) => [savetype.saveTypeID, true])
  ),
  enabledPlugins: {},
  saveCardSize: 180,
  saveViewMode: 'card',
  appTheme: 'system',
}

export type Settings = {
  enabledSaveTypes: Record<string, boolean>
  enabledPlugins: Record<string, boolean>
  saveCardSize: number
  saveViewMode: SaveViewMode
  appTheme: 'light' | 'dark' | 'system'
}

export type AppInfoState = {
  settings: Settings
  settingsLoaded: boolean
  officialSaveTypes: SAVClass[]
  extraSaveTypes: SAVClass[]
  error?: string
}

export type AppInfoAction =
  | {
      type: 'set_savetype_enabled'
      payload: {
        saveType: SAVClass
        enabled: boolean
      }
    }
  | {
      type: 'set_plugin_enabled'
      payload: {
        pluginID: string
        enabled: boolean
      }
    }
  | {
      type: 'load_settings'
      payload: Settings
    }
  | {
      type: 'set_icon_size'
      payload: number
    }
  | {
      type: 'set_save_view'
      payload: SaveViewMode
    }
  | {
      type: 'set_app_theme'
      payload: 'light' | 'dark' | 'system'
    }
  | {
      type: 'set_error'
      payload: string | undefined
    }

export const appInfoReducer: Reducer<AppInfoState, AppInfoAction> = (
  state: AppInfoState,
  action: AppInfoAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'set_savetype_enabled': {
      const enabled = { ...state.settings.enabledSaveTypes }

      enabled[payload.saveType.saveTypeID] = payload.enabled
      return {
        ...state,
        settings: { ...state.settings, enabledSaveTypes: enabled },
      }
    }
    case 'set_plugin_enabled': {
      const enabled = { ...state.settings.enabledPlugins }

      enabled[payload.pluginID] = payload.enabled
      return {
        ...state,
        settings: { ...state.settings, enabledPlugins: enabled },
      }
    }
    case 'load_settings': {
      const officialSaveTypeIDs = state.officialSaveTypes.map((st) => st.saveTypeID)
      const extraSaveTypeIDs = state.extraSaveTypes.map((st) => st.saveTypeID)
      const enabled = Object.fromEntries(
        Object.entries(payload.enabledSaveTypes).filter(
          ([saveTypeID]) =>
            officialSaveTypeIDs.includes(saveTypeID) || extraSaveTypeIDs.includes(saveTypeID)
        )
      )

      state.officialSaveTypes.forEach((st) => {
        if (!(st.saveTypeID in enabled)) {
          enabled[st.saveTypeID] = true
        }
      })

      state.officialSaveTypes.forEach((st) => {
        if (!(st.saveTypeID in enabled)) {
          enabled[st.saveTypeID] = true
        }
      })

      return { ...state, settings: { ...payload, enabledSaveTypes: enabled }, settingsLoaded: true }
    }
    case 'set_icon_size': {
      return {
        ...state,
        settings: { ...state.settings, saveCardSize: payload },
      }
    }
    case 'set_save_view': {
      return {
        ...state,
        settings: { ...state.settings, saveViewMode: payload },
      }
    }
    case 'set_app_theme': {
      return { ...state, settings: { ...state.settings, appTheme: payload } }
    }
    case 'set_error': {
      return { ...state, error: payload }
    }
  }
}

export const appInfoInitialState: AppInfoState = {
  settings: defaultSettings,
  settingsLoaded: false,
  officialSaveTypes: OFFICIAL_SAVE_TYPES,
  extraSaveTypes: EXTRA_SAVE_TYPES,
}

export const AppInfoContext = createContext<
  [AppInfoState, Dispatch<AppInfoAction>, () => SAVClass[]]
>([appInfoInitialState, () => null, () => []])
