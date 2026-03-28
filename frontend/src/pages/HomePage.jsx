import React, { useState } from 'react';
import RoomList from '../components/rooms/RoomList';
import CreateRoomInline from '../components/rooms/CreateRoomInline';

export default function HomePage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white text-black dark:bg-[#0b0b12] dark:text-white">
      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-100px] top-[-100px] h-[600px] w-[600px] bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] h-[500px] w-[500px] bg-purple-600/20 blur-[120px]" />
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-black/10 bg-black/5 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          {showCreateForm ? (
            <CreateRoomInline onCancel={() => setShowCreateForm(false)} />
          ) : (
            <RoomList onCreateRoom={() => setShowCreateForm(true)} />
          )}
        </div>
      </main>
    </div>
  );
}