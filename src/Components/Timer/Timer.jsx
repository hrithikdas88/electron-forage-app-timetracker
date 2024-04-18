// Timer.jsx

import React, { useEffect, useState } from "react";
import "./Timer.css";

function Stopwatch({ idletime, modalOpen, ipcHandle, startDetection, stopDetection }) {
  console.log(idletime, "idletime in stopwatch")
  const initialProjects = [
    { id: 1, name: "Project 1", time: 0, isRunning: false, tasks: [] },
    { id: 2, name: "Project 2", time: 0, isRunning: false, tasks: [] },
  ];

  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    const timers = projects.map((project) => {
      let timer;
      if (project.isRunning && !modalOpen) {
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
  }, [projects, modalOpen]);

  const startStopwatch = (projectId) => {
    setProjects((projects) =>
      projects.map((project) =>
        project.id === projectId
          ? { ...project, isRunning: true }
          : { ...project, isRunning: false }
      )
    );
    startDetection()
    ipcHandle();
  };

  const stopStopwatch = (projectId) => {
    setProjects((projects) =>
      projects.map((project) =>
        project.id === projectId ? { ...project, isRunning: false } : project
      )
    );
    stopDetection()
  };

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
