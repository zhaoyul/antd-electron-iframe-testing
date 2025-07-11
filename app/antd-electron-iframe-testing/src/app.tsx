import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  return (
    <svg width="100%" height="500" style={{ border: '1px solid black' }}>
      <foreignObject width="50%" height="100%">
        <iframe
          src="../iframe_window/index.html?id=1"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </foreignObject>
      <foreignObject x="50%" width="50%" height="100%">
        <iframe
          src="../iframe_window/index.html?id=2"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </foreignObject>
    </svg>
  );
};

export default App;
