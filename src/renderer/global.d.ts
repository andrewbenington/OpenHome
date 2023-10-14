/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (channel: string, listener: Function) => any
        once: (channel: string, listener: Function) => void
        sendMessage: (channel: string, ...args: any) => any
        invoke: (channel: string, ...args: any) => Promise<any>
      }
    }
  }
}
export {}
