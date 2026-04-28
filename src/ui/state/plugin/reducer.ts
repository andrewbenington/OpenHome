import { MonFormat } from '@openhome-core/pkm/interfaces'
import { Option } from '@openhome-core/util/functional'
import { ExtraFormIndex } from '@pkm-rs/pkg'
import { Reducer, createContext } from 'react'
import { ImageResponse } from 'src/ui/backend/backendInterface'
import { PluginState } from './PluginProvider'

export interface MonSpriteData {
  dexNum: number
  formNum: number
  format: MonFormat | 'OHPKM'
  formArgument?: number
  heldItemIndex?: number
  isFemale?: boolean
  isShiny?: boolean
  extraFormIndex: Option<ExtraFormIndex>
}

export interface OpenHomePlugin {
  id: string
  name: string
  version: string
  api_version: number
  icon: string
  assets: Record<string, string>
  icon_image: ImageResponse | null
  getMonSpritePath?: (params: MonSpriteData) => string | null
}

export type PluginStateInternal = { plugins: OpenHomePlugin[]; loaded: boolean }
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
      type: 'remove_plugin'
      payload: string
    }
  | {
      type: 'set_loaded'
      payload: boolean
    }

export const pluginReducer: Reducer<PluginStateInternal, PluginAction> = (
  state: PluginStateInternal,
  action: PluginAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'register_plugin': {
      return {
        ...state,
        plugins: [...state.plugins.filter((plugin) => plugin.id !== payload.id), payload],
      }
    }
    case 'register_plugins': {
      return {
        ...state,
        plugins: [
          ...state.plugins.filter(
            (plugin) => !payload.some((toRegister) => toRegister.id === plugin.id)
          ),
          ...payload,
        ],
      }
    }
    case 'remove_plugin': {
      return {
        ...state,
        plugins: state.plugins.filter((plugin) => plugin.id !== payload),
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

const initialState: PluginState = {
  installedPlugins: [],
  enabledPlugins: [],
  loading: false,
  availablePlugins: {},
  setAvailablePlugins: () => {},
  setUseDevRepo: () => {},
  useDevRepo: false,
  loadInstalled: async () => {},
  outdatedPluginCount: 0,
  registerPlugin: () => {},
  deletePlugin: () => {},
}

export const PluginContext = createContext<PluginState>(initialState)
