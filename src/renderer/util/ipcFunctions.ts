export const handleMenuSave = (onSave: () => void) => {
  return window.electron.ipcRenderer.on('save', () => {
    onSave()
  })
}

export const handleMenuResetAndClose = (onReset: () => void, onClose: () => void) => {
  const callback1 = window.electron.ipcRenderer.on('reset', () => {
    onReset()
  })
  const callback2 = window.electron.ipcRenderer.on('reset-close', () => {
    onReset()
    onClose()
  })
  return () => {
    callback1()
    callback2()
  }
}
