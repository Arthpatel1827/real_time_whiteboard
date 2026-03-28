import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

const CREATE_ROOM = gql`
  mutation CreateRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
    }
  }
`;

export default function CreateRoomInline({ onCancel }) {
    const [roomName, setRoomName] = useState('');
    const [error, setError] = useState('');
    const [createRoom, { loading }] = useMutation(CREATE_ROOM);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!roomName.trim()) {
            setError('Room name is required');
            return;
        }

        try {
            setError('');

            const { data } = await createRoom({
                variables: {
                    name: roomName.trim(),
                },
            });

            if (data?.createRoom?.id) {
                navigate(`/room/${data.createRoom.id}`);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to create room');
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create New Room</h2>

                <button
                    onClick={onCancel}
                    className="rounded-lg border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                    Back
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-2xl border border-black/10 bg-white/60 p-6 shadow-lg dark:border-white/10 dark:bg-black/20"
            >
                <div>
                    <label className="mb-2 block text-sm font-medium">Room Name</label>
                    <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-[#111827]"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition hover:scale-105 disabled:opacity-60"
                    >
                        {loading ? 'Creating...' : 'Create Room'}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-black/10 px-6 py-3 font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}