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
    setInterval(logCursorPosition, 1000);
  });

  app.on("open-url", (event, url) => {
    console.log("open-url event triggered:", url);
    dialog.showErrorBox("Welcome Back", `You arrived from: ${url}`);
  });
}

// function logCursorPosition() {
//   const cursorPosition = screen.getCursorScreenPoint();
//   console.log("Cursor Position:", cursorPosition);
// }

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
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

// app.whenReady().then(() => {
//   createWindow();

//   // const expressApp = express();
//   // expressApp.use(cors());

//   // expressApp.use(express.json());

//   // expressApp.post("/receive-data", (req, res) => {
//   //   const data = req.body;
//   //   console.log("Received data from React app:", data);
//   //   if (data) {
//   //     mainWindow.webContents.send("content-to-renderer", data);
//   //   }
//   //   res.json({ success: true });
//   // });

//   // const server = http.createServer(expressApp);
//   // server.listen(3150, () => {
//   //   console.log("Express server listening on port 3150");
//   // });
// });

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

function logCursorPosition() {
  // Execute xdotool to get the cursor position
  exec("xdotool getmouselocation", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error getting cursor position: ${stderr}`);
      return;
    }

    const cursorPosition = parseCursorPosition(stdout);
    console.log("Cursor Position:", cursorPosition);
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
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
