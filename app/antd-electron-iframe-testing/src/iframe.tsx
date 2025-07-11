import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal } from 'antd';

const App = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
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
    // Show the modal right away
    setTimeout(showModal, 500);
  }, []);

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

