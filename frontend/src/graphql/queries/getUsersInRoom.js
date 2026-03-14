import { gql } from '@apollo/client';

export const GET_USERS_IN_ROOM = gql`
  query GetUsersInRoom($roomId: ID!) {
    usersInRoom(roomId: $roomId) {
      id
      displayName
      online
    }
  }
`;
