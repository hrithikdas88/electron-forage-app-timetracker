import React, { useEffect, useState } from "react";
import ProjectList from "./Components/ProjectList/ProjectList.jsx";
import Stopwatch from "./Components/Timer/Timer.jsx";
import Modal from "@mui/material/Modal";
import { Box, Typography, Button } from "@mui/material";

const Entry = () => {
  const [data, setData] = useState("");
  const [currentProject, setCurrentProject] = useState(null);
  const [timers, setTimers] = useState({});
  const [idletime, setIdletiming] = useState(0);
  const [activity, setactivity] = useState(0);
  const [img, setImg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    window.idletime.idletimer((event, data) => {
      console.log(data, "idletime");
      setIdletiming(data);
      handleopen();
    });

    window.idletime.activitypersentage((event, data) => {
      console.log(data, "activity persentage");
      setactivity(data);
    });
  }, []);

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

  const handleClose = () => {
    setModalOpen(false);
    window.idletime.idleTimehasbeenadded();
  };

  const handleopen = () => {
    setModalOpen(true);
  };

  return (
    <>
      <Stopwatch
        idletime={idletime}
        modalOpen={modalOpen}
        ipcHandle={ss}
        startDetection={window.startdetection}
        stopDetection={window.stopdetection}
      />
      {/* <p>{idletime > 0 && `You have been idle for ${idletime} minites`}</p> */}
      <p>{activity > 0 && `Your activity is ${activity} persent`}</p>

      <Modal
        open={modalOpen}
        onClose={handleClose}
        aria-labelledby="idle-time-modal-title"
        aria-describedby="idle-time-modal-description"
        disableBackdropClick={true}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            id="idle-time-modal-title"
            variant="h5"
            component="h2"
            gutterBottom
          >
            Idle Time Alert
          </Typography>
          <Typography
            id="idle-time-modal-description"
            variant="body1"
            gutterBottom
          >
            You have been idle for {Math.round(idletime)} minutes.
          </Typography>
          <Button onClick={handleClose} variant="contained" color="primary">
            Close
          </Button>
        </Box>
      </Modal>

      {/* <img src={img} alt="no image" /> */}
    </>
  );
};

export default Entry;
