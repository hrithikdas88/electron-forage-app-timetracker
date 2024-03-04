import React, { useEffect, useState } from "react";
import ProjectList from "./Components/ProjectList/ProjectList.jsx";
import nookies from 'nookies';

const Entry = () => {
  const [data, setData] = useState("");
  const [currentProject, setCurrentProject] = useState(null);
  const [timers, setTimers] = useState({});

  const handleTimer = (projectName) => {
    // Stop the previous timer before starting a new one
    stopTimer();
    
    // Start the new timer
    const startTime = Date.now();
    setCurrentProject(projectName);
    setTimers(prevTimers => ({
      ...prevTimers,
      [projectName]: startTime,
    }));
  };

  const stopTimer = () => {
    if (currentProject && timers[currentProject]) {
      const elapsed = Date.now() - timers[currentProject];
      setTimers(prevTimers => ({
        ...prevTimers,
        [currentProject]: undefined,
      }));
      console.log(`Timer stopped for ${currentProject}. Elapsed time: ${elapsed} milliseconds.`);
    }
  };

  useEffect(() => {
    window.indexBridge.authSucess((event, receivedData) => {
      if (receivedData.commandLine[2] === "electron://open") {
        setData(receivedData);
        nookies.set(receivedData.commandLine[2], {
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
        });
      }
    });

    return () => {
      // Cleanup: Stop the timer when the component unmounts
      stopTimer();
    };
  }, [currentProject, timers]);

  const ss = async () => {
    await window.screenshot.captureScreenShot();
    window.screenshot.screenShotCaptured((event, dataURL) => {
      console.log(dataURL);
      // setImg(dataURL);
      // setUrlReached(true);
    });
  };

  const ipcHandle = () => window.openExternalLink();

  return (
    <div>
      <button onClick={ipcHandle}>click me</button>
      {!data ? `login to see your projects` : (
        <div>
          <h2>Project List</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.id} onClick={() => handleTimer(project.name)}>
                {project.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p>
        Then: Launch the app from a web link!
        <a href="electron://open">Click here to launch the app</a>
      </p>
      <button onClick={ss}>Click ss</button>
    </div>
  );
};

export default Entry;
