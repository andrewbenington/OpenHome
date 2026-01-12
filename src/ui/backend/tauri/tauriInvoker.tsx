import { PossibleSaves } from '@openhome-core/save/util/path'
import { Errorable, R } from '@openhome-core/util/functional'
import { JSONArray, JSONObject, JSONValue, LookupMap, SaveRef } from '@openhome-core/util/types'
import { AppTheme } from '@openhome-ui/state/appInfo'
import { PluginMetadataWithIcon } from '@openhome-ui/util/plugin'
import { Pokedex, PokedexUpdate } from '@openhome-ui/util/pokedex'
import { invoke, InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
import { AppState, ImageResponse, StoredLookups } from '../backendInterface'
import { RustResult } from './types'

export type StringToBytes = Record<string, Uint8Array>
export type StringToB64 = Record<string, string>

function invokeAndCatch<C extends OhCommand>(
  cmd: C,
  args?: InvokeArgs,
  options?: InvokeOptions
): Promise<Errorable<OhCommandResult<C>>> {
  return R.tryPromise(invoke(cmd, args, options))
}

// remove this after node 25 is lts
if (!('fromBase64' in Uint8Array)) {
  // @ts-expect-error – intentionally adding this static constructor because it is relatively new to javascript
  Uint8Array.fromBase64 = function (base64: string): Uint8Array {
    const binary = atob(base64)
    const len = binary.length
    const bytes = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    return bytes
  }
}

type OhTauriApi = {
  get_state(): AppState
  get_file_bytes(absolutePath: string): number[]
  get_file_created(absolutePath: string): number
  get_ohpkm_files(): Record<string, number[]>
  delete_storage_files(relativePaths: string[]): Record<string, RustResult<null, string>>
  write_storage_file_bytes(relativePath: string, bytes: Uint8Array): null
  write_storage_file_json(relativePath: string, value: JSONValue): null
  get_storage_file_json(relativePath: string): JSONObject | JSONArray
  find_suggested_saves(saveFolders: string[]): PossibleSaves
  write_file_bytes(absolutePath: string, bytes: Uint8Array): null
  set_app_theme(appTheme: AppTheme): null
  validate_recent_saves(): Record<string, SaveRef>
  get_image_data(absolutePath: string): ImageResponse
  open_directory(absolutePath: string): null
  open_file_location(filePath: string): null
  download_plugin(remoteUrl: string): string
  list_installed_plugins(): PluginMetadataWithIcon[]
  load_plugin_code(pluginId: string): string
  delete_plugin(pluginId: string): string
  handle_windows_accellerator(menuEventId: string): null

  load_banks(): StoredBankDataSerialized
  write_banks(bankData: StoredBankDataSerialized): null

  get_lookups(): StoredLookups
  update_lookups(gen12: LookupMap, gen345: LookupMap): null

  get_ohpkm_store(): StringToB64
  update_ohpkm_store(updates: StringToBytes): null

  get_pokedex(): Pokedex
  update_pokedex(updates: PokedexUpdate[]): null

  start_transaction(): null
  rollback_transaction(): null
  commit_transaction(): null
}

type OhCommand = keyof OhTauriApi

type OhCommandArgs<C extends OhCommand> = Parameters<OhTauriApi[C]>

type OhCommandResult<C extends OhCommand> = ReturnType<OhTauriApi[C]>

type OhTauriApiNoThrow = {
  [C in OhCommand]: (...args: OhCommandArgs<C>) => Promise<Errorable<OhCommandResult<C>>>
}

export const Commands: OhTauriApiNoThrow = {
  get_state() {
    return invokeAndCatch('get_state')
  },

  get_file_bytes(absolutePath: string) {
    return invokeAndCatch('get_file_bytes', { absolutePath })
  },

  get_file_created(absolutePath: string) {
    return invokeAndCatch('get_file_created', { absolutePath })
  },

  get_lookups() {
    return invokeAndCatch('get_lookups')
  },

  update_lookups(gen12: LookupMap, gen345: LookupMap) {
    return invokeAndCatch('update_lookups', { gen12, gen345 })
  },

  get_ohpkm_store() {
    return invokeAndCatch('get_ohpkm_store')
  },

  update_ohpkm_store(updates: StringToBytes): Promise<Errorable<null>> {
    return invokeAndCatch('update_ohpkm_store', { updates })
  },

  get_pokedex() {
    return invokeAndCatch('get_pokedex')
  },

  update_pokedex(updates: PokedexUpdate[]) {
    return invokeAndCatch('update_pokedex', { updates })
  },

  get_storage_file_json(relativePath: string) {
    return invokeAndCatch('get_storage_file_json', { relativePath })
  },

  write_storage_file_json(relativePath: string, data: JSONValue) {
    return invokeAndCatch('write_storage_file_json', { relativePath, data })
  },

  load_banks() {
    return invokeAndCatch('load_banks')
  },

  write_banks(bankData: StoredBankDataSerialized) {
    return invokeAndCatch('write_banks', { bankData })
  },

  write_file_bytes(absolutePath: string, bytes: Uint8Array) {
    return invokeAndCatch('write_file_bytes', { absolutePath, bytes })
  },

  write_storage_file_bytes(relativePath: string, bytes: Uint8Array) {
    return invokeAndCatch('write_storage_file_bytes', { relativePath, bytes })
  },

  async get_ohpkm_files() {
    return invokeAndCatch('get_ohpkm_files')
  },

  async delete_storage_files(relativePaths: string[]) {
    return invokeAndCatch('delete_storage_files', { relativePaths })
  },

  start_transaction() {
    return invokeAndCatch('start_transaction')
  },

  rollback_transaction() {
    return invokeAndCatch('rollback_transaction')
  },

  commit_transaction() {
    return invokeAndCatch('commit_transaction')
  },

  find_suggested_saves(saveFolders: string[]) {
    return invokeAndCatch('find_suggested_saves', { saveFolders })
  },

  set_app_theme(appTheme: AppTheme) {
    return invokeAndCatch('set_app_theme', { appTheme })
  },

  validate_recent_saves() {
    return invokeAndCatch('validate_recent_saves')
  },

  get_image_data(absolutePath: string) {
    return invokeAndCatch('get_image_data', { absolutePath })
  },

  download_plugin(remoteUrl: string) {
    return invokeAndCatch('download_plugin', { remoteUrl })
  },

  list_installed_plugins() {
    return invokeAndCatch('list_installed_plugins')
  },

  load_plugin_code(pluginId: string) {
    return invokeAndCatch('load_plugin_code', { pluginId })
  },

  delete_plugin(pluginId: string) {
    return invokeAndCatch('delete_plugin', { pluginId })
  },

  handle_windows_accellerator(menuEventId: string) {
    return invokeAndCatch('handle_windows_accellerator', { menuEventId })
  },

  open_directory(absolutePath: string) {
    return invokeAndCatch('open_directory', { absolutePath })
  },

  open_file_location(filePath: string) {
    return invokeAndCatch('open_file_location', { filePath })
  },
}

export type StoredBankDataSerialized = {
  banks: OpenHomeBankSerialized[]
  current_bank: number
}

export type OpenHomeBankSerialized = {
  id: string
  index: number
  name: string | undefined
  boxes: OpenHomeBoxSerialized[]
  current_box: number
}

export type OpenHomeBoxSerialized = {
  id: string
  index: number
  name: string | null
  identifiers: Record<number, string>
}
