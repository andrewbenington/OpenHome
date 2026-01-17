import { Dispatch, Reducer, createContext } from 'react'

export type ErrorMessageData = { title: string; messages: string[] }

export type ErrorState = { messageData?: ErrorMessageData }
export type ErrorAction =
  | {
      type: 'set_message'
      payload: ErrorMessageData
    }
  | {
      type: 'clear_message'
      payload?: undefined
    }

export const errorReducer: Reducer<ErrorState, ErrorAction> = (
  state: ErrorState,
  action: ErrorAction
) => {
  const { type, payload } = action

  switch (type) {
    case 'set_message': {
      return { ...state, messageData: payload }
    }
    case 'clear_message': {
      return { ...state, messageData: undefined }
    }
  }
}

const initialState = {}

export const ErrorContext = createContext<[ErrorState, Dispatch<ErrorAction>]>([
  initialState,
  () => null,
])
