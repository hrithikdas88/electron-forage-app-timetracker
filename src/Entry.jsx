import React, { useEffect } from "react";
import Login from "./Components/Login/Login.jsx";
import ProjectList from "./Components/ProjectList/ProjectList.jsx";
import { useState } from "react";

const Entry = () => {
  const [data, setData] = useState("");
  window.indexBridge.authSucess((event, data) => {
    console.log(data.commandLine[2]);
    if (data.commandLine[2] === "electron://open") {
      setData(data);
    }
  });

  //  const handleclick = () => {

  //  }
  console.log(data);
  const ipcHandle = () => window.openExternalLink();
  return (
    <div>
      <button onClick={ipcHandle}>click me</button>
      {!data ? `login to see your projects` : <ProjectList />}

      <p>
        Then: Launch the app from a web link!
        <a href="electron://open">Click here to launch the app</a>
      </p>
    </div>
  );
};

export default Entry;
