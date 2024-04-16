const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("myAPI", {
  sendContentToRenderer: (content) => {
    ipcRenderer.send("content-to-renderer", content);
  },
});
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);

contextBridge.exposeInMainWorld("startdetection", () => {
  ipcRenderer.send("ping");
});
contextBridge.exposeInMainWorld("stopdetection", () => {
  ipcRenderer.send("stopPing");
});
let indexBridge = {
  authSucess: (callback) => ipcRenderer.on("content-to-renderer", callback),
};

let idletime = {
  idletimer: (callback) => ipcRenderer.on("idletime", callback),
};
contextBridge.exposeInMainWorld("idletime", idletime);

contextBridge.exposeInMainWorld("indexBridge", indexBridge);

contextBridge.exposeInMainWorld("screenshot", {
  captureScreenShot: () => ipcRenderer.send("capture-screenshot"),
  screenShotCaptured: (callback) => {
    ipcRenderer.on("screenshot-captured", (event, screenshotURL) =>
      callback(event, screenshotURL)
    );
  },
});
