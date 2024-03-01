// import React, { useEffect, useState } from 'react';

// const WebHIDComponent = () => {
//   const [grantedDevices, setGrantedDevices] = useState([]);
//   const [grantedDevices2, setGrantedDevices2] = useState([]);


//   console.log(grantedDevices, "grant")
//   const formatDevices = (devices) => {
//     return devices.map((device) => device.productName).join('<hr>');
//   };

//   const testIt = async () => {
//     setGrantedDevices(await navigator.hid.getDevices());
//     setGrantedDevices2(
//       await navigator.hid.requestDevice({ filters: [] })
//     );
//   };

//   useEffect(() => {
//     document.getElementById('clickme').addEventListener('click', testIt);

//     // Clean up the event listener on component unmount
//     return () => {
//       document.getElementById('clickme').removeEventListener('click', testIt);
//     };
//   }, []);

//   return (
//     <div>
//       <h1>WebHID API</h1>
//       <button id="clickme">Test WebHID</button>

//       <h3>
//         HID devices automatically granted access via{' '}
//         <i>setDevicePermissionHandler</i>
//       </h3>
//       <div dangerouslySetInnerHTML={{ __html: formatDevices(grantedDevices) }}></div>

//       <h3>
//         HID devices automatically granted access via{' '}
//         <i>select-hid-device</i>
//       </h3>
//       <div dangerouslySetInnerHTML={{ __html: formatDevices(grantedDevices2) }}></div>
//     </div>
//   );
// };

// export default WebHIDComponent;
