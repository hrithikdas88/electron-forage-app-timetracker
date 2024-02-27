const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("myAPI", {
  sendContentToRenderer: (content) => {
    ipcRenderer.send("content-to-renderer", content);
  },
});
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);

contextBridge.exposeInMainWorld("openExternalLink", () => {
  ipcRenderer.send("ping");
});
let indexBridge = {
  authSucess: (callback) => ipcRenderer.on("content-to-renderer", callback),
};

contextBridge.exposeInMainWorld("indexBridge", indexBridge);
