import { createContext } from 'react'
import BackendInterface from './backendInterface'

export const BackendContext = createContext<BackendInterface | null>(null)
