import React from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";

const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      name
      participantCount
      createdAt
    }
  }
`;

const DELETE_ROOM = gql`
  mutation DeleteRoom($roomId: ID!) {
    deleteRoom(roomId: $roomId)
  }
`;

export default function RoomList({ onCreateRoom }) {
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery(GET_ROOMS);

  const [deleteRoom, { loading: deleting }] = useMutation(DELETE_ROOM, {
    onCompleted: () => {
      refetch();
    },
    onError: (err) => {
      console.error("Delete room failed:", err);
      alert("Failed to delete room");
    },
  });

  const handleDelete = async (roomId, roomName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${roomName}"?`
    );

    if (!confirmed) return;

    await deleteRoom({
      variables: { roomId },
    });
  };

  if (loading) {
    return <p className="text-gray-600 dark:text-gray-300">Loading rooms...</p>;
  }

  if (error) {
    return <p className="text-red-500">Failed to load rooms.</p>;
  }

  const rooms = data?.rooms || [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold">Rooms</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refetch()}
            className="text-lg font-medium hover:opacity-70"
          >
            Refresh
          </button>

          <button
            onClick={onCreateRoom}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition hover:scale-105"
          >
            + Create Room
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white/40 p-8 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            No rooms found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-black/10 bg-white/40 p-6 shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 text-lg font-bold text-white">
                    {room.name?.charAt(0)?.toUpperCase() || "R"}
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold">{room.name}</h3>
                  </div>
                </div>

                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {room.participantCount ?? 0} users
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition hover:scale-105"
                >
                  Join Room
                </button>

                <button
                  onClick={() => handleDelete(room.id, room.name)}
                  disabled={deleting}
                  className="rounded-xl bg-red-500 px-5 py-3 font-medium text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}