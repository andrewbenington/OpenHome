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
