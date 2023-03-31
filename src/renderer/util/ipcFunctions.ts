import { SaveRef, StringToStringMap } from "types/types";

export const writeGen12LookupToFile = async (lookupMap: StringToStringMap) => {
  window.electron.ipcRenderer.sendMessage(
    'write-gen12-lookup',
    lookupMap
  );
}

export const writeGen345LookupToFile = async (lookupMap: StringToStringMap) => {
  window.electron.ipcRenderer.sendMessage(
    'write-gen345-lookup',
    lookupMap
  );
}

export const readSaveRefs = async (
  callback: (map: { [key: string]: SaveRef } | undefined) => void
) => {
  window.electron.ipcRenderer.once(
    'save-refs-read',
    (saveRefMap: { [key: string]: SaveRef } | undefined) => {
      if (!saveRefMap) {
        callback(undefined);
        return;
      }
      callback(saveRefMap);
    }
  );
  window.electron.ipcRenderer.sendMessage('read-save-refs');
};

export const addSaveToRecents = async (
  saveRef: SaveRef
) => {
  window.electron.ipcRenderer.sendMessage('add-save-ref', saveRef);
};

export const handleMenuSave = (onSave: () => void) => {
  return window.electron.ipcRenderer.on('save', () => {
    onSave();
  });
};

export const handleMenuResetAndClose = (
  onReset: () => void,
  onClose: () => void
) => {
  const callback1 = window.electron.ipcRenderer.on('reset', () => {
    onReset();
  });
  const callback2 = window.electron.ipcRenderer.on('reset-close', () => {
    onReset();
    onClose();
  });
  return () => {
    callback1();
    callback2();
  };
};

export const handleDeleteOHPKMFiles = (filenames: string[]) => {
  window.electron.ipcRenderer.sendMessage('delete-ohpkm-files', filenames);
};
