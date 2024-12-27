import { Dispatch, Reducer, createContext } from 'react'
import { SaveViewMode } from '../saves/util'
import { BW2SAV } from '../types/SAVTypes/BW2SAV'
import { BWSAV } from '../types/SAVTypes/BWSAV'
import { DPSAV } from '../types/SAVTypes/DPSAV'
import { G1SAV } from '../types/SAVTypes/G1SAV'
import { G2SAV } from '../types/SAVTypes/G2SAV'
import { G3SAV } from '../types/SAVTypes/G3SAV'
import { HGSSSAV } from '../types/SAVTypes/HGSSSAV'
import { ORASSAV } from '../types/SAVTypes/ORASSAV'
import { PtSAV } from '../types/SAVTypes/PtSAV'
import { G3RRSAV } from '../types/SAVTypes/radicalred/G3RRSAV'
import { SMSAV } from '../types/SAVTypes/SMSAV'
import { USUMSAV } from '../types/SAVTypes/USUMSAV'
import { SAVClass } from '../types/SAVTypes/util'
import { XYSAV } from '../types/SAVTypes/XYSAV'

export const defaultSettings: Settings = {
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
    ].map((savetype) => [savetype.saveTypeID, true])
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
  resourcesPath?: string
  settings: Settings
  settingsLoaded: boolean
  officialSaveTypes: SAVClass[]
  extraSaveTypes: SAVClass[]
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

      return { ...state, settings: { ...payload, enabledSaveTypes: enabled } }
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
      return { ...state, settings: { ...state.settings, appTheme: payload }, settingsLoaded: true }
    }
  }
}

export const appInfoInitialState: AppInfoState = {
  settings: defaultSettings,
  settingsLoaded: false,
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
}

export const AppInfoContext = createContext<
  [AppInfoState, Dispatch<AppInfoAction>, () => SAVClass[]]
>([appInfoInitialState, () => null, () => []])
