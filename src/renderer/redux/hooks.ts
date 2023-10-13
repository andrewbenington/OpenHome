import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { RootState } from './state'
import type { AppDispatch } from './store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
