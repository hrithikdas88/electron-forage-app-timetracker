const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  desktopCapturer,
  screen,
  Notification,
  globalShortcut,
} = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { spawn } = require("child_process");
const isPackaged = require("electron").app.isPackaged;
const cron = require("node-cron");
const sudoPrompt = require('sudo-prompt');
const { platform } = require("os");


// function setupSudoersForInputDevices() {
//   const sudoersD = '/etc/sudoers.d';
//   const sudoersFile = path.join(sudoersD, '90-input-devices-nopasswd');
//   const groupCheckCommand = "getent group inputusers || groupadd inputusers";
//   const sudoersContent = "%inputusers ALL=(ALL) NOPASSWD: /bin/cat /dev/input/*";
//   const fullCommand = `${groupCheckCommand} && echo '${sudoersContent}' | sudo EDITOR='tee' visudo -f ${sudoersFile}`;

//   // Options for sudo-prompt
//   const options = {
//     name: 'Electron',
//     icns: '/path/to/app.icns', // (optional) macOS only, path to your app icon
//   };

//   // Use sudo-prompt to execute the command
//   sudo.exec(fullCommand, options, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error: ${error}`);
//       return;
//     }
//     console.log('Sudoers setup completed successfully.');
//     console.log(stdout);
//   });
// }

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let movementTimestamps = [];
let movementTimestampsforidle = [];
let userIsIdle = false;
let idleCalctimeinSeconds = 120;
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
    if (process.platform === "linux") {
      GivePermission()
    } else if (process.platform === "darwin"){
      // startMouseMovementDetectionMac()
    }
    // setupSudoersForInputDevices()
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
  if (process.platform == "linux") {

    console.log("you are in linux")
    const screenshotProcess = exec(
      "gnome-screenshot -d 2 -f screenshotoll.png",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);

        fs.readFile("screenshotoll.png", (err, data) => {
          if (err) {
            console.error(`Error reading file: ${err}`);
            return;
          }

          const screenshotBlob = new Blob([data], { type: "image/png" });

          const notification = new Notification({
            title: "Screenshot Taken",
            body: "Screenshot has been captured successfully",
          });
          notification.show();

        });
      }
    );

    screenshotProcess.on("error", (err) => {
      console.error(`Failed to execute screenshot command: ${err}`);
    });

    screenshotProcess.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Screenshot command exited with code ${code}`);
      } else {
        console.log("Screenshot taken successfully");
      }
    });
  } else {

    const screenShotInfo = await captureScreen();

    const dataURL = screenShotInfo.toDataURL();

    if (dataURL) {
      const notification = new Notification({
        title: "Screenshot Taken",
        body: "Screenshot has been captured successfully",
      });
      notification.show();

      event.sender.send("screenshot-captured", dataURL);
    }
  }
});

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
  const displays = screen.getAllDisplays(); globalShortcut
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

function GivePermission() {
  // Command to give permission to the mouse
  const commandMouse = "chmod a+r /dev/input/mice";

  // Command to give permission to the keyboard
  const eventNumber = getInputDevicePath();
  console.log(eventNumber);
  const commandKeyboard = `chmod a+r ${eventNumber}`;

  // Prompt for sudo password for both commands
  sudoPrompt.exec(`${commandMouse} && ${commandKeyboard}`, { name: 'Your Electron App' }, function (error, stdout, stderr) {
    if (error) {
      console.error('Error:', error);
      return;
    }

    // Command executed successfully
    console.log('stdout:', stdout);
  });

}
// function GivePermission() {
//   try {
//     // Command to give permission to the mouse
//     const commandMouse = "sudo chmod a+r /dev/input/mice";

//     // Command to give permission to the keyboard
//     const eventNumber = getInputDevicePath();
//     const commandKeyboard = `sudo chmod a+r /dev/input/event${eventNumber}`;

//     // Execute commands synchronously
//     const mouseOutput = execSync(commandMouse);
//     console.log('Mouse permission granted:', mouseOutput.toString());

//     const keyboardOutput = execSync(commandKeyboard);
//     console.log('Keyboard permission granted:', keyboardOutput.toString());

//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }


let mouseChild;

function startMouseMovementDetection() {
  console.log("Mouse movement detection started.");

  const mouseCommand = "cat";
  const args = ["/dev/input/mice"];

  mouseChild = spawn(mouseCommand, args);

  mouseChild.stdout.on("data", (data) => {
    if (data && mouseChild && !userIsIdle) {
      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const foridletimeChecker = timestamp.getTime();
      movementTimestampsforidle.push(foridletimeChecker);
      // console.log(movementTimestampsforidle, "idletimestamps");
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;

      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);
        // console.log(newTimestamp);
        console.log(movementTimestamps, "arr");
      }
      if (movementTimestamps.length > idleCalctimeinSeconds) {
        movementTimestamps.shift();
      }
    }
  });

  mouseChild.on("error", (err) => {
    console.error("Mouse Error:", err.message);
  });

  mouseChild.on("exit", (code) => {
    console.log("Mouse movement detection process exited with code", code);
  });
}

let keyboardChild;

function startKeyboardMovementDetection() {
  console.log("Keyboard movement detection started.");
  const inputDevice = getInputDevicePath();

  const keyboardCommand = "cat";
  const args = [inputDevice];

  keyboardChild = spawn(keyboardCommand, args);

  keyboardChild.stdout.on("data", (data) => {
    if (data && keyboardChild && !userIsIdle) {
      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const foridletimeChecker = timestamp.getTime();
      movementTimestampsforidle.push(foridletimeChecker);
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;
      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);
        // console.log(newTimestamp);
        console.log(movementTimestamps, "arra");
      }
      if (movementTimestamps.length > idleCalctimeinSeconds) {
        movementTimestamps.shift();
      }
    }
  });

  keyboardChild.on("error", (err) => {
    console.error("Keyboard Error:", err.message);
  });

  keyboardChild.on("exit", (code) => {
    console.log("Keyboard movement detection process exited with code", code);
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
  console.log(eventNumber, "event")
  return `/dev/input/event${eventNumber}`;
}



ipcMain.on("IdlerimehasbeenAdded", (event) => {
  userIsIdle = false;
});

// function calculateidletime(arr) {
//   if (arr.length < 2) {
//     return;
//   }
//   const idleThresholdInmin = 1;
//   const diffrence = arr[arr.length - 1] - arr[arr.length - 2];
//   console.log(diffrence, "diffrence between time stamps");
//   if (diffrence >= idleThresholdInmin) {
//     console.log(`You are idle for ${diffrence} minutes`);
//   }
// }

function calculateIdleTime(arr, currenttimestamp) {
  const idleThresholdInMin = 1;
  const arrElement = arr[arr.length - 1];

  const differenceInMs = currenttimestamp - arrElement;
  const differenceInMin = differenceInMs / (1000 * 60);
  console.log(differenceInMin, "difference between timestamps in minutes");
  if (differenceInMin >= idleThresholdInMin) {
    mainWindow.restore();

    userIsIdle = true;
    console.log(`You are idle for ${differenceInMin} minutes`);
    mainWindow.webContents.send("idletime", differenceInMin);
  }
}

function calculateActivityPercentage(arr, val) {
  const arrLength = arr.length;
  // if (arrLength === 0) {
  //   // idleTime++;
  //   // console.log("no activity");
  //   // console.log(`You are idle for ${idleTime}  minits`);
  //   // mainWindow.webContents.send("idletime", idleTime);
  //   // dialog.showErrorBox("lol", "you are idle");
  // } else {
  const percentage = (arrLength / val) * 100;
  // idleTime = 0;
  // console.log(idleTime);
  console.log("Activity percentage:", percentage);
  mainWindow.webContents.send("activitypersent", percentage);
}
// }

// let mouseDetectionWin;

// function startMouseMovementDetectionwin() {
//   console.log(isPackaged);
//   let pythonScriptPath;

//   if (isPackaged) {
//     pythonScriptPath = process.platform === "win32" 
//       ? path.join(process.resourcesPath, 'extraResources', 'MouseTracker.exe')
//       : path.join(process.resourcesPath, 'mousemac'); 
//   } else {
//     pythonScriptPath = process.platform === "win32"
//       ? "./MouseTracker.exe"
//       : "./mousemac";
//   }

//   if (!fs.existsSync(pythonScriptPath)) {
//     dialog.showErrorBox("Error", "Mouse tracking file not found.");
//     return;
//   }

//   // Ensure the file is executable
//   if (process.platform !== 'win32') {
//     fs.chmod(pythonScriptPath, 0o755, (err) => {
//       if (err) {
//         dialog.showErrorBox("Error", "Failed to set executable permissions.");
//         return;
//       }
//       runMouseDetection(pythonScriptPath);
//     });
//   } else {
//     dialog.showErrorBox("Permission", "itsworking")
//     runMouseDetection(pythonScriptPath);
//   }
// }

// function runMouseDetection(pythonScriptPath) {
//   mouseDetectionWin = spawn(pythonScriptPath);

//   mouseDetectionWin.stdout.on("data", (data) => {
//     console.log(`stdout: ${data}`);
//     console.log(data)
//   });

//   mouseDetectionWin.stderr.on("data", (data) => {
//     console.error(`stderr: ${data}`);
//     dialog.showErrorBox("Error", `${data}`);
//   });

//   mouseDetectionWin.on("close", (code) => {
//     console.log(`Child process exited with code ${code}`);
//   });
// }

let mouseDetectionWin;
function startMouseMovementDetectionwin() {
  console.log(isPackaged);
  // const pythonScriptPath = isPackaged
  //   ? path.join("./resources/MouseTracker.exe")
  //   : path.join("./MouseTracker.exe");

  let pythonScriptPath;

  if (isPackaged) {
    pythonScriptPath = process.platform === "win32" 
    ? path.join(process.resourcesPath, 'extraResources', 'MouseTracker.exe')
    : path.join(process.resourcesPath, 'mousemac'); 
  } else {
    pythonScriptPath = process.platform === "win32"
      ? "./MouseTracker.exe"
      : "./mousemac";
  }

  if (!fs.existsSync(pythonScriptPath)) {
    dialog.showErrorBox("Error", "MouseTracker.exe file not found.");
    return;
  }
// 

  mouseDetectionWin = spawn(pythonScriptPath);


  mouseDetectionWin.stdout.on("data", (data) => {
    if (data && mouseDetectionWin && !userIsIdle) {
      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const foridletimeChecker = timestamp.getTime();
      movementTimestampsforidle.push(foridletimeChecker);
      // console.log(movementTimestampsforidle, "idletimestamps");
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;

      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);
        // console.log(newTimestamp);
        console.log(movementTimestamps, "arr");
      }
      if (movementTimestamps.length > idleCalctimeinSeconds) {
        movementTimestamps.shift();
      }
    }
  });

  mouseDetectionWin.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    dialog.showErrorBox("Error", `${data}`);
  });

  mouseDetectionWin.on("close", (code) => {
    // dialog.showErrorBox("Error", `existed with ${code}`);
    console.log(`child process exited with code ${code}`);
  });
}

let keyBoardDetectionWin;

console.log(process.resourcesPath)
function startKeyboardMovementDetectionWin() {
  let pythonScriptPath;
  if (isPackaged) {
    pythonScriptPath = process.platform === "win32" 
    ? path.join(process.resourcesPath, 'extraResources', 'Keyboardtracker.exe') // Windows path
    : path.join(process.resourcesPath, 'keyboardmac'); 
  } else {
    pythonScriptPath = process.platform === "win32"
      ? "./Keyboardtracker.exe"
      : "./keyboardmac";
  }
  if (!fs.existsSync(pythonScriptPath)) {
    dialog.showErrorBox("Error", "keyboardtracker file not found.");
    return;
  }

  keyBoardDetectionWin = spawn(pythonScriptPath);

  keyBoardDetectionWin.stdout.on("data", (data) => {
    if (data && keyBoardDetectionWin && !userIsIdle) {
      const timestamp = new Date();
      const min = timestamp.getMinutes();
      const foridletimeChecker = timestamp.getTime();
      movementTimestampsforidle.push(foridletimeChecker);
      const sec = timestamp.getSeconds();
      const newTimestamp = min + ":" + sec;
      if (!movementTimestamps.includes(newTimestamp)) {
        movementTimestamps.push(newTimestamp);
        // console.log(newTimestamp);
        console.log(movementTimestamps, "arra");
      }
      if (movementTimestamps.length > idleCalctimeinSeconds) {
        movementTimestamps.shift();
      }
    }
  });

  keyBoardDetectionWin.stderr.on("data", (data) => {
    dialog.showErrorBox("Error", `${data} keyboard`);
    console.error(`stderr: ${data}`);
  });
  keyBoardDetectionWin.on("close", (code) => {
    // dialog.showErrorBox("Error", `${code}keyboard existed`);
    console.log(`child process exited with code ${code}`);

  });
}

function stopDetection() {
  movementTimestamps = [];
  if (process.platform === "win32" || process.platform === "darwin") {
    if (keyBoardDetectionWin) {
      keyBoardDetectionWin.kill();
      console.log("Keyboard detection process killed");
      keyBoardDetectionWin.on("exit", (code, signal) => {
        console.log(
          `Keyboard detection process exited with code ${code} and signal ${signal}`
        );
      });
      keyBoardDetectionWin = null;
    }

    if (mouseDetectionWin) {
      mouseDetectionWin.kill();
      console.log("Mouse detection process killed");
      mouseDetectionWin.on("exit", (code, signal) => {
        console.log(
          `Mouse detection process exited with code ${code} and signal ${signal}`
        );
      });
      mouseDetectionWin = null;
    }

    if (!keyBoardDetectionWin && !mouseDetectionWin) {
      console.log("No keyboard or mouse detection processes running");
    }

  } else if (process.platform === "linux") {
    if (mouseChild) {
      console.log("Stopping mouse movement detection.");
      mouseChild.kill("SIGTERM");
    } else {
      console.log("Mouse movement detection is not running.");
    }
    if (keyboardChild) {
      console.log("Stopping keyboard movement detection.");
      keyboardChild.kill("SIGTERM");
    } else {
      console.log("Keyboard movement detection is not running.");
    }
  }

}

let cronJob;
let cronJobIdle;
console.log(movementTimestamps, "arra");
ipcMain.on("ping", () => {
  const TrackerOnTeam = new Date().getTime();
  movementTimestampsforidle.push(TrackerOnTeam);
  cronJobIdle = cron.schedule("*/1 * * * *", () => {
    console.log("cron has started");
    const currenttimestamp = new Date().getTime();
    console.log(currenttimestamp);
    calculateIdleTime(movementTimestampsforidle, currenttimestamp);
  });

  if (process.platform === "linux") {
    startMouseMovementDetection();
    startKeyboardMovementDetection();
  } else {
    console.log(process.platform);
    startKeyboardMovementDetectionWin();
    startMouseMovementDetectionwin();
  }
  console.log("ping");
  cronJob = cron.schedule("*/2 * * * *", async () => {
    if (process.platform === "win32") {
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
    } else if (process.platform === "linux") {
      const screenshotProcess = exec(
        "gnome-screenshot -d 2 -f screenshotoll.png",
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);

          fs.readFile("screenshotoll.png", (err, data) => {
            if (err) {
              console.error(`Error reading file: ${err}`);
              return;
            }

            const screenshotBlob = new Blob([data], { type: "image/png" });
            console.log(screenshotBlob)

            const notification = new Notification({
              title: "Screenshot Taken",
              body: "Screenshot has been captured successfully",
            });
            notification.show();

          });
        }
      );

      screenshotProcess.on("error", (err) => {
        console.error(`Failed to execute screenshot command: ${err}`);
      });

      screenshotProcess.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Screenshot command exited with code ${code}`);
        } else {
          console.log("Screenshot taken successfully");
        }
      });

    }

    calculateActivityPercentage(movementTimestamps, idleCalctimeinSeconds);

    movementTimestamps = [];
  });
});
ipcMain.on("stopPing", () => {
  if (cronJob && cronJobIdle) {
    cronJob.stop();
    cronJobIdle.stop();
    stopDetection();
    console.log("Cron job stopped");
  } else {
    console.log("No cron job to stop");
  }
});

// function startMouseMovementDetectionMac() {
//   console.log("Starting mouse movement detection...");

//   // Spawn the compiled Objective-C binary
//   const detectionProcess = spawn('./mouse_movement_detection');
  

//   // Listen for stdout data from the child process
//   detectionProcess.stdout.on('data', (data) => {
//       console.log(data.toString());
//   });

//   // Listen for stderr data from the child process
//   detectionProcess.stderr.on('data', (data) => {
//     //  console.error(`Error: ${data}`);
//       console.log("heyeyeyeye")
//   });

//   // Listen for when the child process exits
//   detectionProcess.on('close', (code) => {
//       console.log(`Mouse movement detection process exited with code ${code}`);
//   });

//   // Handle cleanup
//   process.on('SIGINT', () => {
//       detectionProcess.kill();
//       process.exit(0);
//   });
// }


