declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
        ) => void;
        invoke: (channel: string, ...args: any) => any;
      };
    };
  }
}
export {};
