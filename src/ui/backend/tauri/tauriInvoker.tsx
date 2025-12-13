import { PossibleSaves } from '@openhome/core/save/util/path'
import { PluginMetadataWithIcon } from '@openhome/ui/util/Plugin'
import { invoke } from '@tauri-apps/api/core'
import * as E from 'fp-ts/lib/Either'
import { Pokedex, PokedexUpdate } from 'src/types/pokedex'
import { StoredBankData } from 'src/types/storage'
import { Errorable, JSONArray, JSONObject, JSONValue, LookupMap, SaveRef } from 'src/types/types'
import { AppState, ImageResponse, StoredLookups } from '../backendInterface'
import { RustResult } from './types'

function rustResultToEither<T, E>(result: RustResult<T, E>): E.Either<E, T> {
  return 'Ok' in result ? E.right(result.Ok) : E.left(result.Err)
}

export const TauriInvoker = {
  getState() {
    const promise = invoke('get_state') as Promise<AppState>

    return promise.then(E.right).catch(E.left)
  },

  getFileBytes(absolutePath: string): Promise<Errorable<Uint8Array>> {
    const promise: Promise<number[]> = invoke('get_file_bytes', {
      absolutePath,
    })

    return promise.then((u8s) => E.right(new Uint8Array(u8s))).catch(E.left)
  },

  getFileCreated(absolutePath: string): Promise<Errorable<Date>> {
    const promise: Promise<number> = invoke('get_file_created', {
      absolutePath,
    })

    return promise.then((unixMillis) => E.right(new Date(unixMillis))).catch(E.left)
  },

  getLookups(): Promise<Errorable<StoredLookups>> {
    const promise: Promise<StoredLookups> = invoke('get_lookups')

    return promise.then(E.right).catch(E.left)
  },

  updateLookups(gen12: LookupMap, gen345: LookupMap): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('update_lookups', { gen12, gen345 })

    return promise.then(E.right).catch(E.left)
  },

  getPokedex(): Promise<Errorable<Pokedex>> {
    const promise: Promise<Pokedex> = invoke('get_pokedex')

    return promise.then(E.right).catch(E.left)
  },

  registerInPokedex(updates: PokedexUpdate[]): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('update_pokedex', { updates })

    return promise.then(E.right).catch(E.left)
  },

  getStorageFileJSON(relativePath: string): Promise<Errorable<JSONObject | JSONArray>> {
    const promise: Promise<JSONObject | JSONArray> = invoke('get_storage_file_json', {
      relativePath,
    })

    return promise.then(E.right).catch(E.left)
  },

  writeStorageFileJSON(relativePath: string, data: JSONValue): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('write_storage_file_json', {
      relativePath,
      data,
    })

    return promise.then(E.right).catch(E.left)
  },

  getBanks(): Promise<Errorable<StoredBankData>> {
    const promise: Promise<StoredBankData> = invoke('load_banks')

    return promise.then(E.right).catch(E.left)
  },

  writeBanks(bankData: StoredBankData): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('write_banks', { bankData })

    return promise.then(E.right).catch(E.left)
  },

  writeFileBytes(absolutePath: string, bytes: Uint8Array): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('write_file_bytes', {
      absolutePath,
      bytes,
    })

    return promise.then(E.right).catch(E.left)
  },

  writeStorageFileBytes(relativePath: string, bytes: Uint8Array): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('write_storage_file_bytes', {
      relativePath,
      bytes,
    })

    return promise.then(E.right).catch(E.left)
  },

  async getOHPKMFiles(): Promise<Errorable<Record<string, Uint8Array>>> {
    const promise: Promise<Record<string, number[]>> = invoke('get_ohpkm_files')

    return promise
      .then((result) => {
        return E.right(
          Object.fromEntries(
            Object.entries(result).map(([filename, bytes]) => [filename, new Uint8Array(bytes)])
          )
        )
      })
      .catch(E.left)
  },

  async deleteStorageFiles(
    relativePaths: string[]
  ): Promise<Errorable<Record<string, Errorable<null>>>> {
    const promise: Promise<Record<string, RustResult<null, string>>> = invoke(
      'delete_storage_files',
      { relativePaths }
    )

    return promise
      .then((result) => {
        return E.right(
          Object.fromEntries(
            Object.entries(result).map(([file, result]) => [file, rustResultToEither(result)])
          )
        )
      })
      .catch(E.left)
  },

  startTransaction(): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('start_transaction')

    return promise.then(E.right).catch(E.left)
  },

  rollbackTransaction(): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('rollback_transaction')

    return promise.then(E.right).catch(E.left)
  },

  commitTransaction(): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('commit_transaction')

    return promise.then(E.right).catch(E.left)
  },

  findSuggestedSaves(saveFolders: string[]): Promise<Errorable<PossibleSaves>> {
    const promise: Promise<PossibleSaves> = invoke('find_suggested_saves', { saveFolders })

    return promise.then(E.right).catch(E.left)
  },

  setTheme(appTheme: 'light' | 'dark' | 'system'): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('set_app_theme', { appTheme })

    return promise.then(E.right).catch(E.left)
  },

  getRecentSaves(): Promise<Errorable<Record<string, SaveRef>>> {
    const promise: Promise<Record<string, SaveRef>> = invoke('validate_recent_saves')

    return promise.then(E.right).catch(E.left)
  },

  getImageData(absolutePath: string): Promise<Errorable<ImageResponse>> {
    const promise: Promise<ImageResponse> = invoke('get_image_data', { absolutePath })

    return promise.then(E.right).catch(E.left)
  },

  downloadPlugin(remoteUrl: string): Promise<Errorable<string>> {
    const promise: Promise<string> = invoke('download_plugin', { remoteUrl })

    return promise.then(E.right).catch(E.left)
  },

  listInstalledPlugins(): Promise<Errorable<PluginMetadataWithIcon[]>> {
    const promise: Promise<PluginMetadataWithIcon[]> = invoke('list_installed_plugins')

    return promise.then(E.right).catch(E.left)
  },

  loadPluginCode(pluginId: string): Promise<Errorable<string>> {
    const promise: Promise<string> = invoke('load_plugin_code', { pluginId })

    return promise.then(E.right).catch(E.left)
  },

  deletePlugin(pluginId: string): Promise<Errorable<string>> {
    const promise: Promise<string> = invoke('delete_plugin', { pluginId })

    return promise.then(E.right).catch(E.left)
  },

  handleMenuAccelleratorWindows(menuEventId: string): Promise<null> {
    const promise: Promise<null> = invoke('handle_windows_accellerator', { menuEventId })

    return promise
  },

  openDirectory(directoryPath: string): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke('open_directory', { absolutePath: directoryPath })

    return promise.then(E.right).catch(E.left)
  },
}
