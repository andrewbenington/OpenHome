import { R } from '@openhome-core/util/functional'
import BackendInterface from './backendInterface'
import { TauriBackend } from './tauri/backend'

export const AppBackend: BackendInterface = R.expect(
  await TauriBackend.start(),
  (error) => `error starting Tauri backend: ${error}`
)
