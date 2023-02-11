declare global {
  interface Window {
    electron: {
      // ipcRenderer: {
      //   on: (channel: string, listener: Function) => void;
      //   once: (channel: string, listener: Function) => void;
      //   send: (channel: string, ...args: any) => any;
      // };
      ipcRenderer: any;
    };
  }
}
export {};
