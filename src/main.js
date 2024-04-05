const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  desktopCapturer,
  screen,
} = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { spawn } = require("child_process");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("electron", process.execPath, [
      path.resolve(process.argv[1]),
      console.log(path.resolve(process.argv[1])),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("electron");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  console.log("nolock");
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("yess");
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    mainWindow.webContents.send("content-to-renderer", {
      commandLine,
    });
    dialog.showErrorBox(
      "Welcome Back",
      `You arrived from: ${commandLine.pop().slice(0, -1)}`
    );
  });

  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    createWindow();
    // setInterval(logCursorPosition, 10000);
  });

  app.on("open-url", (event, url) => {
    console.log("open-url event triggered:", url);

    dialog.showErrorBox("Welcome Back", `You arrived from: ${url}`);
  });
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      // devTools: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  console.log(process.platform);
  if (process.platform === "linux") {
    startMouseMovementDetection();
    startKeyboardMovementDetection();
  } else if (process.platform === "win32") {
    console.log("youareonwindows");
    startKeyboardMovementDetectionWin()
    startMouseMovementDetectionwin()

   
  }
  mainWindow.on("closed", () => {
    powershellProcess.kill();
    mainWindow = null;
  });
};

// app.on('ready', createWindow);

ipcMain.on("content-to-renderer", (event, content) => {
  // Do something with the content in the main process
  console.log("Content received in main process:", content);
});

ipcMain.on("ping", () => shell.openExternal("http://localhost:3002/"));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//ss-logic

ipcMain.on("capture-screenshot", async (event) => {
  const screenShotInfo = await captureScreen();

  const dataURL = screenShotInfo.toDataURL();
  event.sender.send("screenshot-captured", dataURL);
});

async function captureScreen() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const options = {
    types: ["screen"],
    thumbnailSize: {
      width: primaryDisplay.size.width,
      height: primaryDisplay.size.height,
    },
    screen: {
      id: primaryDisplay.id,
    },
  };

  const sources = await desktopCapturer.getSources(options);

  const image = sources[0].thumbnail;
  return image;
}

function startMouseMovementDetection() {
  console.log("Mouse movement detection started.");

  const mouseCommand = "cat /dev/input/mice";
  const mouseChild = exec(mouseCommand);

  mouseChild.stdout.on("data", (data) => {
    if (data) {
      console.log("mouse is moving");
      console.count(data);
    }
  });

  mouseChild.on("error", (err) => {
    console.error("Mouse Error:", err.message);
  });

  mouseChild.on("exit", (code) => {
    console.log("Mouse movement detection process exited with code", code);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    mouseChild.kill();
  });
}

function startKeyboardMovementDetection() {
  console.log("Keyboard movement detection started.");
  const inputDevice = getInputDevicePath();

  const keyboardCommand = `cat ${inputDevice} `;
  const keyboardChild = exec(keyboardCommand);

  keyboardChild.stdout.on("data", (data) => {
    console.log(data);
  });

  keyboardChild.on("error", (err) => {
    console.error("Keyboard Error:", err.message);
  });

  keyboardChild.on("exit", (code) => {
    console.log("Keyboard movement detection process exited with code", code);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    keyboardChild.kill();
  });
}

const COMMAND_GET_INPUT_DEVICE_EVENT_NUMBER =
  "grep -E 'Handlers|EV=' /proc/bus/input/devices |" +
  "grep -B1 'EV=120013' |" +
  "grep -Eo 'event[0-9]+' |" +
  "grep -Eo '[0-9]+' |" +
  "tr -d '\n'";

function executeCommand(cmd) {
  try {
    console.log("loll");
    const result = execSync(cmd, { encoding: "utf-8" });
    return result.trim();
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
}

function getInputDevicePath() {
  const eventNumber = executeCommand(COMMAND_GET_INPUT_DEVICE_EVENT_NUMBER);
  return `/dev/input/event${eventNumber}`;
}


function startKeyboardMovementDetectionWin () {
  const scriptPath = path.join('./Get-keyboard.ps1');
  console.log(scriptPath)
  const powershellProcess = spawn("powershell.exe", ["-File", scriptPath]);
  powershellProcess.stdout.on("data", (data) => {
    if (!data) {
      console.log("no data");
    } else {
      console.log(`PowerShell Output: ${data}`);
    }
  });

  powershellProcess.stderr.on("data", (data) => {
    if (!data) {
      console.log("no data");
    } else {
      console.log(`PowerShell Output: ${data}`);
    }
    console.error(`PowerShell Error: ${data}`);
  });
}

function startMouseMovementDetectionwin () {
  const scriptPath = path.join('./Get-MousePosition.ps1')
  const powershellProcess = spawn("powershell.exe" , ["-File", scriptPath])
  powershellProcess.stdout.on("data", (data) => {
    if (!data) {
      console.log("no data");
    } else {
      console.log(`PowerShell Output: ${data}`);
    }
  });

  powershellProcess.stderr.on("data", (data) => {
    if (!data) {
      console.log("no data");
    } else {
      console.log(`PowerShell Output: ${data}`);
    }
    console.error(`PowerShell Error: ${data}`);
  });

}