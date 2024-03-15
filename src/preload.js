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
  addedtime : (callback) => ipcRenderer.on("added-time", callback)
};


contextBridge.exposeInMainWorld("indexBridge", indexBridge);

contextBridge.exposeInMainWorld("screenshot", {
  captureScreenShot: () => ipcRenderer.send("capture-screenshot"),
  screenShotCaptured: (callback) => {
    ipcRenderer.on("screenshot-captured", (event, screenshotURL) =>
      callback(event, screenshotURL)
    );
  },
});
