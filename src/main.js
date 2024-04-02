const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  desktopCapturer,
  screen,
  nativeImage,
  Notification,
} = require("electron");
const { exec } = require("child_process");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { response } = require("express");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;
let lastMovementTimestamp;
let intervalId;

// intervalId = setInterval(checkIdle, 10000);
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
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
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

    // lastMovementTimestamp = Date.now();
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
  // mainWindow.loadFile("index.html")

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  //linux logic
  startMouseMovementDetection();
  startKeyboardMovementDetection();
};

// app.on('ready', createWindow);

ipcMain.on("content-to-renderer", (event, content) => {
  // Do something with the content in the main process
  console.log("Content received in main process:", content);
});

// ipcMain.on("ping", () => {
//   takeScreenshotAndSendBlob(mainWindow);
// });

ipcMain.on("ping", () => {
  const randomNumber = Math.floor(Math.random() * 1000);
  const screenshotProcess = exec(
    `/usr/bin/gnome-screenshot -d 2 -f screenshot${randomNumber}.png`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      // console.log(`stdout: ${stdout}`);
      // Show notification using Electron's Notification API
      const notification = new Notification({
        title: "Screenshot Taken",
        body: "Screenshot has been captured successfully",
        // expiration: 5000
      });
      notification.show();

    }
  );

  // Handle errors during the execution of the command
  screenshotProcess.on("error", (err) => {
    console.error(`Failed to execute screenshot command: ${err}`);
  });

  // Handle the process exit event
  screenshotProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Screenshot command exited with code ${code}`);
    } else {
      console.log("Screenshot taken successfully");
      // Open the external URL after taking the screenshot
    }
  });
});

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

// function to update time
let movementTimestamps = [];
let idleTime = 0;
function calculateActivityPercentage(arr, val) {
  const arrLength = arr.length;
  if (arrLength === 0) {
    idleTime++;
    console.log("no activity");
    console.log(`You are idle for ${idleTime}  minits`);
  } else {
    const percentage = (arrLength / val) * 100;
    idleTime = 0;
    console.log("Activity percentage:", percentage);
  }
}

//linux mouse and keyboard detection

function startMouseMovementDetection() {
  console.log("Mouse movement detection started.");

  const mouseCommand = "cat /dev/input/mice";
  const mouseChild = exec(mouseCommand);

  mouseChild.stdout.on("data", (data) => {
    if (data) {
      //lastMovementTimestamp = Date.now();

      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;

      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);

        if (movementTimestamps.length > 120) {
          movementTimestamps.shift();
        }
      }
      // console.log(idleTime, "idletime");
      // console.log(movementTimestamps, "mouse");
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
  // console.log(movementTimestamps, "movements");
}

function startKeyboardMovementDetection() {
  console.log("Keyboard movement detection started.");
  const inputDevice = getInputDevicePath();
  const keyboardCommand = `cat ${inputDevice} `;
  const keyboardChild = exec(keyboardCommand);

  keyboardChild.stdout.on("data", (data) => {
    // console.log(data);
    lastMovementTimestamp = Date.now();
    if (data) {
      //lastMovementTimestamp = Date.now();

      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;

      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);

        if (movementTimestamps.length > 120) {
          movementTimestamps.shift();
        }
      }
      // console.log(idleTime, "idletime");
      // console.log(movementTimestamps, "keyboard");
    }
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

setInterval(() => {
  calculateActivityPercentage(movementTimestamps, 60);
  movementTimestamps = [];
}, 60000);

//check idle time

// let idleWindow;
// const IDLE_TIME_THRESHOLD = 10000;
// let isidlewindowPresent;
// isidlewindowPresent = false;
// intervalId = setInterval(() => {
//   const currentTime = Date.now();
//   const idletime = currentTime - lastMovementTimestamp;
//   // console.log(idletime, "idle");
//   // if (idletime >= IDLE_TIME_THRESHOLD) {
//   //   if (!isidlewindowPresent) {
//   //     isidlewindowPresent = true;
//   //     console.log("if");
//   //     idleWindow = new BrowserWindow({
//   //       width: 400,
//   //       height: 600,
//   //       webPreferences: {
//   //         preload: IDLE_WINDOW_PRELOAD_WEBPACK_ENTRY,
//   //       },
//   //     });
//   //     idleWindow.loadURL(IDLE_WINDOW_WEBPACK_ENTRY);
//   //     idleWindow.webContents.send("idletime", {
//   //       idletime,
//   //     });
//   //     idleWindow.on("closed", () => {
//   //       isidlewindowPresent = false;
//   //     });
//   //   } else {
//   //     console.log("else");
//   //     idleWindow.webContents.send("idletime", {
//   //       idletime,
//   //     });
//   //   }
//   // }
// }, 10000);

// function clearIdleInterval() {
//   clearInterval(intervalId);
// }

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

// function generateUniqueFilename() {
//   const timestamp = Date.now();
//   return `screenshot_${timestamp}.png`;
// }

// const screenshotFilename = generateUniqueFilename();
