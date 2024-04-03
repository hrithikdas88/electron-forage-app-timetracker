import React, { useEffect, useState } from "react";
import ProjectList from "./Components/ProjectList/ProjectList.jsx";
import Stopwatch from "./Components/Timer/Timer.jsx";

const Entry = () => {
  const [data, setData] = useState("");
  const [currentProject, setCurrentProject] = useState(null);
  const [timers, setTimers] = useState({});
  const [idletime, setIdletime] = useState();
  console.log(window);
  // useEffect(() => {
  //   console.log("useeffect has been trggered");
  //   window.indexBridge.addedtime((event, data) => {
  //     console.log(data);
  //   });
  // }, [window.indexBridge.addedtime]);

  // window.indexBridge.addedtime((event, data)=> {
  //   if(data){
  //     setIdletime(data)
  //   }
  // })

  console.log(idletime);

  useEffect(() => {
    window.indexBridge.authSucess((event, receivedData) => {
      if (receivedData.commandLine[2] === "electron://open") {
        setData(receivedData);
        // nookies.set(receivedData.commandLine[2], {
        //   maxAge: 30 * 24 * 60 * 60,
        //   path: "/",
        // });
      }
    });
  }, [currentProject, timers]);

  const ss = async () => {
    await window.screenshot.captureScreenShot();
    window.screenshot.screenShotCaptured((event, dataURL) => {
      console.log(dataURL);
      // setImg(dataURL);
      // setUrlReached(true);
    });
  };

  const ipcHandle = () => window.takess();
  // window.ipcRenderer.on("user-continued", (event, data) => {
  //   console.log("User continued:", data.idleSeconds);
  //   // Do something with the idleSeconds data in your renderer process
  // });

  return (
    <div>
      {/* <button onClick={ipcHandle}>take screenshot linux</button> */}
      {/* {!data ? `login to see your projects` : <ProjectList />} */}
      {/* <p>
        {idletime?.idleseconds}
        Then: Launch the app from a web link!
        <a href="electron://open">Click here to launch the app</a>
      </p> */}
      <Stopwatch ipcHandle={ipcHandle} />

      {/* {idletime && idletime} */}
      <button onClick={ss}>Click screenshot windows</button>
    </div>
  );
};

export default Entry;
