import { Dispatch, Reducer, createContext } from 'react'

export type AppInfoState = {
  resourcesPath?: string
}

export type AppInfoAction = {
  type: 'set_resources_path'
  payload: string
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
  }
}

const initialState = {}

export const AppInfoContext = createContext<[AppInfoState, Dispatch<AppInfoAction>]>([
  initialState,
  () => null,
])
