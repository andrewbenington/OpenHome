import { SaveRef, StringIndexableMap } from "types/types";

export const readBoxData = async (callback: (data: string) => void) => {
  window.electron.ipcRenderer.once('home-box-read', (boxString: string) => {
    callback(boxString);
  });
  window.electron.ipcRenderer.sendMessage('read-home-box', 'Box 1');
};

export const readGen12Lookup = async (
  callback: (map: { [key: string]: string } | undefined) => void
) => {
  window.electron.ipcRenderer.once(
    'gen12-lookup-read',
    (lookupMap: { [key: string]: string } | undefined) => {
      if (!lookupMap) {
        callback(undefined);
        return;
      }
      callback(lookupMap);
    }
  );
  window.electron.ipcRenderer.sendMessage('read-gen12-lookup');
};

export const saveGen12Lookup = async (lookupMap: StringIndexableMap) => {
  window.electron.ipcRenderer.sendMessage(
    'write-gen12-lookup',
    lookupMap
  );
}

export const readGen345Lookup = async (
  callback: (map: { [key: string]: string } | undefined) => void
) => {
  window.electron.ipcRenderer.once(
    'gen345-lookup-read',
    (lookupMap: { [key: string]: string } | undefined) => {
      if (!lookupMap) {
        callback(undefined);
        return;
      }
      callback(lookupMap);
    }
  );
  window.electron.ipcRenderer.sendMessage('read-gen345-lookup');
};

export const saveGen345Lookup = async (lookupMap: StringIndexableMap) => {
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
