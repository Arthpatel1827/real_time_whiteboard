import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ROOMS } from '../../graphql/queries/getRooms';

export default function RoomList({ onCreateRoom }) {
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery(GET_ROOMS, {
    fetchPolicy: 'network-only',
    pollInterval: 2000,
  });

  const rooms = data?.rooms || [];

  return (
    <div>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Rooms</h3>

        <div className="flex gap-3">
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Refresh
          </button>

          <button
            onClick={onCreateRoom}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition shadow-lg"
          >
            + Create Room
          </button>
        </div>
      </div>

      {/* STATES */}
      {loading && <p className="text-gray-400">Loading...</p>}
      {error && <p className="text-red-400">Error loading rooms</p>}

      {/* EMPTY */}
      {!loading && rooms.length === 0 && (
        <p className="text-gray-400 text-center py-10">
          No rooms yet 🚀
        </p>
      )}

      {/* GRID */}
      <div className="grid sm:grid-cols-2 gap-6">

        {rooms.map((room) => (
          <div
            key={room.id}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/40 hover:bg-white/10 transition-all duration-300"
          >
            {/* TOP */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center font-bold">
                {room.name.charAt(0)}
              </div>

              <span className="text-sm text-gray-400">
                {room.participantCount} users
              </span>
            </div>

            {/* NAME */}
            <h4 className="text-lg font-semibold mb-3">
              {room.name}
            </h4>

            {/* BUTTON */}
            <button
              onClick={() => navigate(`/room/${room.id}`)}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition shadow-md"
            >
              Join Room
            </button>
          </div>
        ))}

      </div>

    </div>
  );
}