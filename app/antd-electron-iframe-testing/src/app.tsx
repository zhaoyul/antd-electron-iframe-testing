import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  const iframe1Ref = useRef<HTMLIFrameElement>(null);
  const iframe2Ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Relay message to the other iframe
      if (event.data.type === 'MODAL_CLOSED') {
        if (event.data.from === '1' && iframe2Ref.current) {
          iframe2Ref.current.contentWindow.postMessage(event.data, '*');
        } else if (event.data.from === '2' && iframe1Ref.current) {
          iframe1Ref.current.contentWindow.postMessage(event.data, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <svg width="100%" height="500" style={{ border: '1px solid black' }}>
      <foreignObject width="50%" height="100%">
        <iframe
          ref={iframe1Ref}
          src="../iframe_window/index.html?id=1"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </foreignObject>
      <foreignObject x="50%" width="50%" height="100%">
        <iframe
          ref={iframe2Ref}
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
