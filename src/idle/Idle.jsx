import React, { useEffect, useState } from "react";

const Idle = () => {
  const [time, settime] = useState(0);
  // console.log(window.api);
  useEffect(() => {
    window.api.idletime((event, data) => {
      console.log(data);
      settime(Math.floor(data.idletime / 1000));
    });
  }, [time]);

  return <div>You have been idle for {time} seconds</div>;
};

export default Idle;
