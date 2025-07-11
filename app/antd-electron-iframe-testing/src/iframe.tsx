import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Modal } from 'antd';

const App = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const id = new URLSearchParams(window.location.search).get('id');

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    // Notify the other iframe to open its modal
    window.parent.postMessage({ type: 'MODAL_CLOSED', from: id }, '*');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    // Notify the other iframe to open its modal
    window.parent.postMessage({ type: 'MODAL_CLOSED', from: id }, '*');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MODAL_CLOSED' && event.data.from !== id) {
        // Open this modal after a short delay
        setTimeout(showModal, 500);
      }
    };

    window.addEventListener('message', handleMessage);

    // Start the chain reaction
    if (id === '1') {
      setTimeout(showModal, 500);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [id]);

  return (
    <div>
      <Modal title={`Modal from iframe ${id}`} open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </div>
  );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
