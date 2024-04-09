import React, { useEffect, useState } from "react";
import ProjectList from "./Components/ProjectList/ProjectList.jsx";
import Stopwatch from "./Components/Timer/Timer.jsx";

const Entry = () => {
  const [data, setData] = useState("");
  const [currentProject, setCurrentProject] = useState(null);
  const [timers, setTimers] = useState({});
  const [idletime, setIdletiming] = useState(0)
  const [img, setImg] = useState("")


  // useEffect(()=>{
    window.idletime.idletimer((event, data) => {
      console.log(data, "idletime")
      setIdletiming(data)
    })
  // },[window.idletime])

 

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
      setImg(dataURL);
      // setUrlReached(true);
    });
  };

  

  return (
    <>
    <Stopwatch ipcHandle={ss}/>
    {/* <img src={img} alt="no image" /> */}
    </>
    // <div>
    //   <button onClick={ipcHandle}>click me</button>
    //   {!data ? `login to see your projects` : <ProjectList />}
    //   <p>
    //     Then: Launch the app from a web link!
    //     <a href="electron://open">Click here to launch the app dsdsadsa</a>
    //   </p>
    //   <button onClick={ss}>Click ss</button>
    //   <p>{idletime > 0 && `You have been idle for ${idletime} minites`}</p>
    // </div>
  );
};

export default Entry;
