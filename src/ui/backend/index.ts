import { R } from '@openhome-core/util/functional'
import { TauriBackend } from './tauri/backend'

export const AppBackend = R.expect(
  await TauriBackend.start(),
  (error) => `error starting Tauri backend: ${error}`
)
