import { LogLevel } from '@openhome-core/backend/backendInterface'
import { Errorable, R } from '@openhome-core/util/functional'
import { JSONArray, JSONObject, JSONValue } from '@openhome-core/util/types'
import { LogFilter } from '@openhome-ui/pages/logs'
import { invoke, InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
import { commands as SpectaCommands } from './spectaCommands'

type StringToBytes = Record<string, Uint8Array>
export type StringToB64 = Record<string, string>

function invokeAndCatch<C extends OhCommand>(
  cmd: C,
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<Errorable<OhCommandResult<C>>> {
  return R.tryPromise(invoke(cmd, args, options))
}

export type LogFilterIpc = Omit<LogFilter, 'start' | 'end'> & {
  start_epoch_seconds: number
  end_epoch_seconds: number
}

type OhTauriApi = {
  get_file_bytes(absolutePath: string): number[]
  write_storage_file_json(relativePath: string, value: JSONValue): null
  get_storage_file_json(relativePath: string): JSONObject | JSONArray
  add_to_ohpkm_store(updates: StringToBytes): null
  log(level: LogLevel, message: string, fields?: Record<string, unknown>): void
}

type OhCommand = keyof OhTauriApi

type OhCommandArgs<C extends OhCommand> = Parameters<OhTauriApi[C]>

type OhCommandResult<C extends OhCommand> = ReturnType<OhTauriApi[C]>

type OhTauriApiNoThrow = {
  [C in OhCommand]: (...args: OhCommandArgs<C>) => Promise<Errorable<OhCommandResult<C>>>
} & typeof SpectaCommands

export const Commands: OhTauriApiNoThrow = {
  ...SpectaCommands,

  get_file_bytes(absolutePath: string) {
    return invokeAndCatch('get_file_bytes', { absolutePath })
  },

  add_to_ohpkm_store(updates: StringToBytes): Promise<Errorable<null>> {
    return invokeAndCatch('add_to_ohpkm_store', { updates })
  },

  get_storage_file_json(relativePath: string) {
    return invokeAndCatch('get_storage_file_json', { relativePath })
  },

  write_storage_file_json(relativePath: string, data: JSONValue) {
    return invokeAndCatch('write_storage_file_json', { relativePath, data })
  },

  log(level: LogLevel, message: string, context?: Record<string, unknown | undefined>) {
    return invokeAndCatch('log', { entry: { level, message, context } })
  },
}

export type StoredBankDataSerialized = {
  banks: OpenHomeBankSerialized[]
  current_bank: number
}

type OpenHomeBankSerialized = {
  id: string
  index: number
  name: string | undefined
  boxes: OpenHomeBoxSerialized[]
  current_box: number
}

type OpenHomeBoxSerialized = {
  id: string
  index: number
  name: string | null
  identifiers: Record<number, string>
}
