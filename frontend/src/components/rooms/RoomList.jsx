import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ROOMS } from '../../graphql/queries/getRooms';

export default function RoomList({ onCreateRoom }) {
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery(GET_ROOMS, {
    fetchPolicy: 'network-only',
    pollInterval: 2000,
    notifyOnNetworkStatusChange: true,
  });

  if (loading) return <p>Loading rooms...</p>;

  if (error) {
    console.error('GET_ROOMS error:', error);
    return <p>Error loading rooms.</p>;
  }

  const rooms = data?.rooms || [];

  return (
    <div className="room-list">
      <div className="room-list-header">
        <h2>Available Rooms</h2>
        <button onClick={() => refetch()}>Refresh</button>
        <button onClick={onCreateRoom}>Create Room</button>
      </div>

      <ul>
        {rooms.map((room) => (
          <li key={room.id} style={{ margin: '10px 0' }}>
            <strong>{room.name}</strong> ({room.participantCount} participants)
            <button
              onClick={() => navigate(`/room/${room.id}`)}
              style={{ marginLeft: '10px' }}
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}