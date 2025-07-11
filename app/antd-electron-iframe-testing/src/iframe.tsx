import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal, Alert } from 'antd';

const App = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const id = new URLSearchParams(window.location.search).get('id');

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    const modalInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        setIsModalVisible(true);
      }
    }, 1000);

    const alertInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        setIsAlertVisible(true);
        setTimeout(() => setIsAlertVisible(false), 2000);
      }
    }, 700);

    return () => {
      clearInterval(modalInterval);
      clearInterval(alertInterval);
    };
  }, []);

  return (
    <div>
      {isAlertVisible && (
        <Alert
          message={`Alert from iframe ${id}`}
          type="warning"
          showIcon
          closable
          onClose={() => setIsAlertVisible(false)}
        />
      )}
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