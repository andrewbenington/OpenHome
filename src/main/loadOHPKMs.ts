import fs from 'fs';
import { app } from 'electron';
import OHPKM from 'pkm/OHPKM';
import { readFileFromPath } from './fileHandlers';

export function loadOHPKMs() {
  const appDataPath = app.getPath('appData');
  const files = fs.readdirSync(`${appDataPath}/open-home/storage/mons`);
  const monMap: { [key: string]: Uint8Array } = {};
  files.forEach((file) => {
    if (file.endsWith('.ohpkm')) {
      const bytes = readFileFromPath(
        `${appDataPath}/open-home/storage/mons/${file}`
      );
      if (bytes) {
        monMap[file.slice(0, file.length - 6)] = bytes;
      }
    }
  });
  return monMap;
}
