import { BW2SAV } from '@openhome-core/save/BW2SAV'
import { BWSAV } from '@openhome-core/save/BWSAV'
import { CompassSave } from '@openhome-core/save/compass/CompassSave'
import { DPSAV } from '@openhome-core/save/DPSAV'
import { G1SAV } from '@openhome-core/save/G1SAV'
import { G2SAV } from '@openhome-core/save/G2SAV'
import { G3SAV } from '@openhome-core/save/G3SAV'
import { Gen7AlolaSave } from '@openhome-core/save/Gen7AlolaSave'
import { BdspSave } from '@openhome-core/save/Gen89/BdspSave'
import { LegendsArceusSave } from '@openhome-core/save/Gen89/LegendsArceus'
import { LegendsZaSave } from '@openhome-core/save/Gen89/LegendsZaSave'
import { ScarletVioletSave } from '@openhome-core/save/Gen89/ScarletVioletSave'
import { SwordShieldSave } from '@openhome-core/save/Gen89/SwordShieldSave'
import { HGSSSAV } from '@openhome-core/save/HGSSSAV'
import { OfficialSAV } from '@openhome-core/save/interfaces'
import { LGPESAV } from '@openhome-core/save/LGPESAV'
import { G8LumiSAV } from '@openhome-core/save/luminescentplatinum/G8LUMISAV'
import { ORASSAV } from '@openhome-core/save/ORASSAV'
import { PtSAV } from '@openhome-core/save/PtSAV'
import { G3RRSAV } from '@openhome-core/save/radicalred/G3RRSAV'
import { G3UBSAV } from '@openhome-core/save/unbound/G3UBSAV'
import { PluginSaveClass, SAVClass } from '@openhome-core/save/util'
import { XYSAV } from '@openhome-core/save/XYSAV'
import { MonDisplayState } from '@openhome-ui/hooks/monDisplay'
import { SaveViewMode } from '@openhome-ui/saves/util'
import { updateStyleForUiScale } from '@openhome-ui/util/style'
import { Dispatch, Reducer, createContext } from 'react'

export const OFFICIAL_SAVE_TYPES: SAVClass<OfficialSAV>[] = [
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
  Gen7AlolaSave,
  LGPESAV,
  SwordShieldSave,
  BdspSave,
  LegendsArceusSave,
  ScarletVioletSave,
  LegendsZaSave,
]
const EXTRA_SAVE_TYPES = [G3RRSAV, G3UBSAV, G8LumiSAV, CompassSave]

function initialMonDisplayState() {
  return {
    filter: {},
    topRightIndicator: null,
    showShiny: true,
    showItem: true,
    showNotesIndicator: true,
    showTags: true,
    showBackgroundColor: true,
  }
}

export const defaultSettings: Settings = {
  enabledSaveTypes: Object.fromEntries(
    [...OFFICIAL_SAVE_TYPES, ...EXTRA_SAVE_TYPES].map((savetype) => [savetype.saveTypeID, true])
  ),
  enabledPlugins: {},
  saveCardSize: 180,
  saveViewMode: 'card',
  monDisplayState: initialMonDisplayState(),
  appTheme: 'system',
  autoScanOnStartup: true,
  zoomLevel: 100,
}

export type AppTheme = 'light' | 'dark' | 'system'

export type Settings = {
  enabledSaveTypes: Record<string, boolean>
  enabledPlugins: Record<string, boolean>
  saveCardSize: number
  saveViewMode: SaveViewMode
  monDisplayState: MonDisplayState
  appTheme: AppTheme
  autoScanOnStartup: boolean
  zoomLevel: number
}

export type AppInfoState = {
  settings: Settings
  settingsLoaded: boolean
  officialSaveTypes: SAVClass[]
  extraSaveTypes: PluginSaveClass[]
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
      payload: AppTheme
    }
  | {
      type: 'set_auto_scan'
      payload: boolean
    }
  | { type: 'set_mon_display_state'; payload: MonDisplayState }
  | {
      type: 'set_zoom_level'
      payload: number
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

      state.extraSaveTypes.forEach((st) => {
        if (!(st.saveTypeID in enabled)) {
          enabled[st.saveTypeID] = true
        }
      })

      updateStyleForUiScale(payload.zoomLevel)

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
    case 'set_mon_display_state': {
      return { ...state, settings: { ...state.settings, monDisplayState: payload } }
    }
    case 'set_auto_scan': {
      return { ...state, settings: { ...state.settings, autoScanOnStartup: payload } }
    }
    case 'set_zoom_level': {
      updateStyleForUiScale(payload)
      return { ...state, settings: { ...state.settings, zoomLevel: payload } }
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
