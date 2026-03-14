import { gql } from '@apollo/client';

export const JOIN_ROOM = gql`
  mutation JoinRoom($roomId: ID!, $userName: String!) {
    joinRoom(roomId: $roomId, userName: $userName) {
      id
      displayName
      roomId
    }
  }
`;
