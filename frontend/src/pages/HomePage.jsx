import React, { useState } from 'react';
import RoomList from '../components/rooms/RoomList';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import ConnectionStatus from '../components/system/ConnectionStatus';
import ThemeToggle from '../components/system/ThemeToggle';
import LogoutButton from '../components/system/LogoutButton';

export default function HomePage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white text-black dark:bg-[#0b0b12] dark:text-white">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-100px] top-[-100px] h-[600px] w-[600px] bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] h-[500px] w-[500px] bg-purple-600/20 blur-[120px]" />
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-3 text-4xl font-bold">Your Workspace</h2>
        <p className="mb-10 text-gray-600 dark:text-gray-400">
          Jump into a room or create a new one.
        </p>

        <div className="rounded-3xl border border-black/10 bg-black/5 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <RoomList onCreateRoom={() => setCreateModalOpen(true)} />
        </div>
      </main>

      <CreateRoomModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}