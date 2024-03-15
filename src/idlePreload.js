const { ipcRenderer, contextBridge } = require("electron");

let api = {
  idletime: (callback) => ipcRenderer.on("idletime", callback),
};

contextBridge.exposeInMainWorld("api", api);
