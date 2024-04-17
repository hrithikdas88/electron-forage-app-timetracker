const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  desktopCapturer,
  screen,
  Notification,
} = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { spawn } = require("child_process");
const isPackaged = require("electron").app.isPackaged;
const cron = require("node-cron");

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

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// app.on('ready', createWindow);

ipcMain.on("content-to-renderer", (event, content) => {
  // Do something with the content in the main process
  console.log("Content received in main process:", content);
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

  if (dataURL) {
    const notification = new Notification({
      title: "Screenshot Taken",
      body: "Screenshot has been captured successfully",
    });
    notification.show();
  }
  event.sender.send("screenshot-captured", dataURL);
});

async function captureScreen() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = displays.find(
    (display) => display.id === screen.getPrimaryDisplay().id
  );

  // const aspectRatio = primaryDisplay.size.width / primaryDisplay.size.height;
  // const thumbnailWidth = 100; // Set your desired thumbnail width
  // const thumbnailHeight = thumbnailWidth / aspectRatio;

  const options = {
    types: ["screen"],
    thumbnailSize: {
      // Set to a high static value
      width: 1920,
      height: 1080,
    },
    fetchWindowIcons: false,
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

let movementTimestamps = [];
let idleTime = 0;
let idleCalctimeinSeconds = 60
function calculateActivityPercentage(arr, val) {
  const arrLength = arr.length;
  if (arrLength === 0) {
    idleTime++;
    console.log("no activity");
    console.log(`You are idle for ${idleTime}  minits`);
    mainWindow.webContents.send("idletime", idleTime);
    dialog.showErrorBox("lol", "you are idle");
  } else {
    const percentage = (arrLength / val) * 100;
    idleTime = 0;
    console.log(idleTime);
    console.log("Activity percentage:", percentage);
    mainWindow.webContents.send("activitypersent", percentage);
  }
}

let mouseDetectionWin;
function startMouseMovementDetectionwin() {
  console.log(isPackaged)
  const pythonScriptPath = isPackaged
    ? path.join("./resources/MouseTracker.exe")
    : path.join("./MouseTracker.exe");

  // if (!fs.existsSync(pythonScriptPath)) {
  //   dialog.showErrorBox("Error", "MouseTracker.exe file not found.");
  //   return;
  // }

   mouseDetectionWin = exec(pythonScriptPath);

  mouseDetectionWin.stdout.on("data", (data) => {
    if (data && mouseDetectionWin) {
      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;
      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);
        // console.log(newTimestamp);
        console.log(movementTimestamps, "arr")
      }
      if (movementTimestamps.length > idleCalctimeinSeconds) {
        movementTimestamps.shift();
      }
    }
  });

  mouseDetectionWin.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  mouseDetectionWin.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}


let keyBoardDetectionWin ;
function startKeyboardMovementDetectionWin() {
  const pythonScriptPath = isPackaged
    ? path.join("./resources/keyboardtracker.exe")
    : path.join("./keyboardtracker.exe");

  // if (!fs.existsSync(pythonScriptPath)) {
  //   dialog.showErrorBox("Error", "keyboardtracker.exe file not found.");
  //   return;
  // }

  keyBoardDetectionWin = exec(pythonScriptPath);


  keyBoardDetectionWin.stdout.on("data", (data) => {
    if (data && keyBoardDetectionWin) {
      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;
      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);
        console.log(newTimestamp);
        console.log(movementTimestamps, "arra")
      }
      if (movementTimestamps.length > idleCalctimeinSeconds) {
        movementTimestamps.shift();
      }
    }
  });

  keyBoardDetectionWin.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  keyBoardDetectionWin.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
}


function stopDetection() {
  if (keyBoardDetectionWin) {
    keyBoardDetectionWin.kill();
    console.log("Keyboard detection process killed");
    keyBoardDetectionWin.on('exit', (code, signal) => {
      console.log(`Keyboard detection process exited with code ${code} and signal ${signal}`);
    });
    keyBoardDetectionWin = null;
  }

  if (mouseDetectionWin) {
    mouseDetectionWin.kill();
    console.log("Mouse detection process killed");
    mouseDetectionWin.on('exit', (code, signal) => {
      console.log(`Mouse detection process exited with code ${code} and signal ${signal}`);
    });
    mouseDetectionWin = null;
  }

  if (!keyBoardDetectionWin && !mouseDetectionWin) {
    console.log("No keyboard or mouse detection processes running");
  }
}


let cronJob;
console.log(movementTimestamps,"arra")
ipcMain.on("ping", () => {
  if (process.platform === "linux") {
    startMouseMovementDetection();
    startKeyboardMovementDetection();
  } else if (process.platform === "win32") {
    console.log("youareonwindows");
    startKeyboardMovementDetectionWin();
    startMouseMovementDetectionwin();
  }
  console.log("ping");
  cronJob = cron.schedule('*/1 * * * *', async () => {
    const screenShotInfo = await captureScreen();
    const dataURL = screenShotInfo.toDataURL();
    if (dataURL) {
      const notification = new Notification({
        title: "Screenshot Taken",
        body: "Screenshot has been captured successfully",
      });
      notification.show();
    }
  
    mainWindow.webContents.send("screenshot-captured", dataURL);
    calculateActivityPercentage(movementTimestamps, idleCalctimeinSeconds); 
    movementTimestamps = [];
});
});
ipcMain.on("stopPing", () => {
  if (cronJob) {
    cronJob.stop();
    stopDetection()
    console.log("Cron job stopped");
  } else {
    console.log("No cron job to stop");
  }
});
