import { Dispatch, Reducer, createContext } from 'react'

interface MonData {
  dexNum: number
  formeNum: number
  format: string
  isFemale?: boolean
  isShiny?: boolean
}

export interface OpenHomePlugin {
  pluginID: string
  pluginName: string
  getMonSpritePath?: (params: MonData) => string | null
}

export type PluginState = { plugins: OpenHomePlugin[]; loaded: boolean }
export type PluginAction =
  | {
      type: 'register_plugin'
      payload: OpenHomePlugin
    }
  | {
      type: 'register_plugins'
      payload: OpenHomePlugin[]
    }
  | {
      type: 'disable_plugin'
      payload: string
    }
  | {
      type: 'set_loaded'
      payload: boolean
    }

export const pluginReducer: Reducer<PluginState, PluginAction> = (
  state: PluginState,
  action: PluginAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'register_plugin': {
      return {
        ...state,
        plugins: [
          ...state.plugins.filter((plugin) => plugin.pluginID !== payload.pluginID),
          payload,
        ],
      }
    }
    case 'register_plugins': {
      return {
        ...state,
        plugins: [
          ...state.plugins.filter(
            (plugin) => !payload.some((toRegister) => toRegister.pluginID === plugin.pluginID)
          ),
          ...payload,
        ],
      }
    }
    case 'disable_plugin': {
      return {
        ...state,
        plugins: state.plugins.filter((plugin) => plugin.pluginID !== payload),
      }
    }
    case 'set_loaded': {
      return {
        ...state,
        loaded: payload,
      }
    }
  }
}

const initialState = { plugins: [], loaded: false }

export const PluginContext = createContext<[PluginState, Dispatch<PluginAction>]>([
  initialState,
  () => null,
])