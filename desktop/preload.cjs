const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vibestepCompanion', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  onStatus: (callback) => ipcRenderer.on('companion-status', (_event, status) => callback(status)),
  openApp: () => ipcRenderer.invoke('open-app'),
  pair: () => ipcRenderer.invoke('pair'),
  openAudioFolder: () => ipcRenderer.invoke('open-audio-folder'),
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  quit: () => ipcRenderer.invoke('quit'),
})
