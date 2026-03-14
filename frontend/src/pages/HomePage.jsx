import React, { useState } from 'react';
import RoomList from '../components/rooms/RoomList';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import ConnectionStatus from '../components/system/ConnectionStatus';
import ThemeToggle from '../components/system/ThemeToggle';
import LogoutButton from '../components/system/LogoutButton';

export default function HomePage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleOpenModal = () => {
    console.log("Create room button clicked");
    setCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
  };

  return (
    <div className="app-container">

      <header className="app-header">
        <h1>Real-Time Whiteboard</h1>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ConnectionStatus />
          <ThemeToggle />
          <LogoutButton />
        </div>

      </header>

      <main>
        <RoomList onCreateRoom={handleOpenModal} />
      </main>

      <CreateRoomModal
        open={isCreateModalOpen}
        onClose={handleCloseModal}
      />

    </div>
  );
}