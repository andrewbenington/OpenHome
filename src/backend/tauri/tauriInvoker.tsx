import { invoke } from "@tauri-apps/api/core";
import * as E from "fp-ts/lib/Either";
import { Errorable, JSONArray, JSONObject, JSONValue } from "src/types/types";
import { RustResult } from "./types";

function rustResultToEither<T, E>(result: RustResult<T, E>): E.Either<E, T> {
  return "Ok" in result ? E.right(result.Ok) : E.left(result.Err);
}

export const TauriInvoker = {
  getFileBytes(absolutePath: string): Promise<Errorable<Uint8Array>> {
    const promise: Promise<number[]> = invoke("get_file_bytes", {
      absolutePath,
    });
    return promise.then((u8s) => E.right(new Uint8Array(u8s))).catch(E.left);
  },

  getFileCreated(absolutePath: string): Promise<Errorable<Date>> {
    const promise: Promise<number> = invoke("get_file_created", {
      absolutePath,
    });
    return promise
      .then((unixMillis) => E.right(new Date(unixMillis)))
      .catch(E.left);
  },

  getStorageFileJSON(
    relativePath: string
  ): Promise<Errorable<JSONObject | JSONArray>> {
    const promise: Promise<JSONObject | JSONArray> = invoke(
      "get_storage_file_json",
      {
        relativePath,
      }
    );
    return promise.then(E.right).catch(E.left);
  },

  writeStorageFileJSON(
    relativePath: string,
    data: JSONValue
  ): Promise<Errorable<null>> {
    console.log({
      relativePath,
      data,
    });
    const promise: Promise<null> = invoke("write_storage_file_json", {
      relativePath,
      data,
    });
    return promise.then(E.right).catch(E.left);
  },

  writeFileBytes(
    absolutePath: string,
    bytes: Uint8Array
  ): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke("write_file_bytes", {
      absolutePath,
      bytes,
    });
    return promise.then(E.right).catch(E.left);
  },

  writeStorageFileBytes(
    relativePath: string,
    bytes: Uint8Array
  ): Promise<Errorable<null>> {
    const promise: Promise<null> = invoke("write_storage_file_bytes", {
      relativePath,
      bytes,
    });
    return promise.then(E.right).catch(E.left);
  },

  async getOHPKMFiles(): Promise<Errorable<Record<string, Uint8Array>>> {
    const promise: Promise<Record<string, number[]>> =
      invoke("get_ohpkm_files");
    return promise
      .then((result) => {
        return E.right(
          Object.fromEntries(
            Object.entries(result).map(([filename, bytes]) => [
              filename,
              new Uint8Array(bytes),
            ])
          )
        );
      })
      .catch(E.left);
  },

  async deleteStorageFiles(
    relativePaths: string[]
  ): Promise<Errorable<Record<string, Errorable<null>>>> {
    const promise: Promise<Record<string, RustResult<null, string>>> = invoke(
      "delete_storage_files",
      { relativePaths }
    );
    return promise
      .then((result) => {
        return E.right(
          Object.fromEntries(
            Object.entries(result).map(([file, result]) => [
              file,
              rustResultToEither(result),
            ])
          )
        );
      })
      .catch(E.left);
  },
};
