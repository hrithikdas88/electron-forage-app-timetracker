import React, { useState, useEffect } from "react";
import "./Timer.css";

function Stopwatch({ ipcHandle,startDetection,stopDetection }) {
  const initialProjects = [
    { id: 1, name: "Project 1", time: 0, isRunning: false, tasks: [] },
    { id: 2, name: "Project 2", time: 0, isRunning: false, tasks: [] },
  ];

  const [projects, setProjects] = useState(initialProjects);
  const [TimerIndicator, setTimerIndicator] = useState(false);
  console.log(TimerIndicator, "timerindicator");

  useEffect(() => {
    const timers = projects.map((project) => {
      let timer;
      if (project.isRunning) {
        timer = setInterval(() => {
          setProjects((projects) =>
            projects.map((p) =>
              p.id === project.id ? { ...p, time: p.time + 1 } : p
            )
          );
        }, 1000);
      } else {
        clearInterval(timer);
      }
      return timer;
    });

    return () => {
      timers.forEach((timer) => clearInterval(timer));
    };
  }, [projects]);

  const startStopwatch = (projectId) => {
    setProjects((projects) =>
      projects.map((project) =>
        project.id === projectId
          ? { ...project, isRunning: true }
          : { ...project, isRunning: false }
      )
    );
    startDetection()
    setTimerIndicator(true);
    ipcHandle();
  };

  const stopStopwatch = (projectId) => {
    setTimerIndicator(false);
    setProjects((projects) =>
      projects.map((project) =>
        project.id === projectId ? { ...project, isRunning: false } : project
      )
    );
    stopDetection()
  };

  // useEffect(() => {
  //   let intervalId;

  //   if (TimerIndicator) {
  //     console.log("Screenshot will be taken");
  //     intervalId = setInterval(() => {
  //       ipcHandle();
  //     }, 30000);
  //   } else {
  //     console.log("Screenshot will not be taken");
  //   }

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [TimerIndicator]);

  //   const resetStopwatch = (projectId) => {
  //     setProjects(projects => projects.map(project =>
  //       project.id === projectId ? { ...project, time: 0, isRunning: false } : project
  //     ));
  //   };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const totalProjectTime = projects.reduce(
    (total, project) => total + project.time,
    0
  );

  return (
    <div className="container">
      <h1>TeamTracer</h1>
      <div className="project-list">
        {projects.map((project) => (
          <div key={project.id} className="project">
            <h2 className="project-name">{project.name}</h2>
            <div className="project-time">
              <span>{formatTime(project.time)}</span>
            </div>
            <div className="project-controls">
              <button onClick={() => startStopwatch(project.id)}>Start</button>
              <button onClick={() => stopStopwatch(project.id)}>Stop</button>
              {/* <button onClick={() => resetStopwatch(project.id)}>Reset</button> */}
            </div>
          </div>
        ))}
      </div>
      <div className="total-time">
        <h2>Total Time for All Projects</h2>
        <span>{formatTime(totalProjectTime)}</span>
      </div>
    </div>
  );
}

export default Stopwatch;