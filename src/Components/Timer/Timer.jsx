import React, { useState, useEffect } from "react";

function Stopwatch({ ipcHandle }) {
  const initialProjects = [
    { id: 1, name: "Project 1", time: 0, isRunning: false },
    { id: 2, name: "Project 2", time: 0, isRunning: false },
    // Add more projects here if needed
  ];

  const [projects, setProjects] = useState(initialProjects);
  const [TimerIndicator, setTimerIndicator] = useState(false);

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
    setTimerIndicator(true);
    ipcHandle();
  };

  const stopStopwatch = (projectId) => {
    setProjects((projects) =>
      projects.map((project) =>
        project.id === projectId ? { ...project, isRunning: false } : project
      )
    );
  };

  useEffect(() => {
    if (TimerIndicator) {
      setInterval(() => {
        ipcHandle();
      }, 30000);
    }
  }, [TimerIndicator]);

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
    <div>
      <h1>Project Stopwatches</h1>
      <div>
        {projects.map((project) => (
          <div key={project.id}>
            <h2>{project.name}</h2>
            <div>
              <span>{formatTime(project.time)}</span>
            </div>
            <div>
              <button onClick={() => startStopwatch(project.id)}>Start</button>
              <button onClick={() => stopStopwatch(project.id)}>Stop</button>
              {/* <button onClick={() => resetStopwatch(project.id)}>Reset</button> */}
            </div>
          </div>
        ))}
      </div>
      <div>
        <h2>Total Time for All Projects</h2>
        <span>{formatTime(totalProjectTime)}</span>
      </div>
    </div>
  );
}

export default Stopwatch;
