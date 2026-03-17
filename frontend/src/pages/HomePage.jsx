import React, { useState } from 'react';
import RoomList from '../components/rooms/RoomList';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import ConnectionStatus from '../components/system/ConnectionStatus';
import ThemeToggle from '../components/system/ThemeToggle';
import LogoutButton from '../components/system/LogoutButton';

export default function HomePage() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-[#0b0b12]">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] top-[-100px] left-[-100px]" />
        <div className="absolute w-[500px] h-[500px] bg-purple-600/20 blur-[120px] bottom-[-100px] right-[-100px]" />
      </div>

      {/* NAVBAR */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
              W
            </div>
            <h1 className="text-xl font-semibold">Whiteboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <ThemeToggle />
            <LogoutButton />
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">

        {/* HERO */}
        <h2 className="text-4xl font-bold mb-3">
          Your Workspace
        </h2>
        <p className="text-gray-400 mb-10">
          Jump into a room or create a new one.
        </p>

        {/* GLASS CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">

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