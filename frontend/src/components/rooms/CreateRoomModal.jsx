import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ROOM } from '../../graphql/mutations/createRoom';
import { GET_ROOMS } from '../../graphql/queries/getRooms';

export default function CreateRoomModal({ open, onClose }) {
  const [name, setName] = useState('');

  const [createRoom, { loading, error }] = useMutation(CREATE_ROOM, {
    refetchQueries: [{ query: GET_ROOMS }],
    awaitRefetchQueries: true,
    onCompleted: (result) => {
      console.log('Room created:', result);
      setName('');
      onClose();
    },
    onError: (err) => {
      console.error('Create room error:', err);
    },
  });

  if (!open) return null;

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    await createRoom({
      variables: { name: trimmedName },
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create Room</h3>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Room name"
        />

        <div className="modal-actions">
          <button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>

        {error && <p>Failed to create room.</p>}
      </div>
    </div>
  );
}