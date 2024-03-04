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
    setInterval(logCursorPosition, 10000);
    console.log(screen.getAllDisplays(), "sssssss");
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
      devTools: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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

let previousPosition = null;
let isDialogDisplayed = false;

function logCursorPosition() {
  exec("xdotool getmouselocation", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error getting cursor position: ${stderr}`);
      return;
    }

    const cursorPosition = parseCursorPosition(stdout);
    console.log("Cursor Position:", cursorPosition);

    if (
      previousPosition &&
      cursorPosition.x === previousPosition.x &&
      cursorPosition.y === previousPosition.y
    ) {
      if (!isDialogDisplayed) {
        dialog.showMessageBox({
          type: "info",
          title: "Idle Alert",
          message: "System is idle!",
        });
        isDialogDisplayed = true;
      }
    } else {
      isDialogDisplayed = false;
    }

    previousPosition = { x: cursorPosition.x, y: cursorPosition.y };
  });
}

function parseCursorPosition(xdotoolOutput) {
  const regex = /x:(\d+) y:(\d+)/;
  const match = xdotoolOutput.match(regex);

  if (match) {
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2]),
    };
  }

  return null;
}
