import { gql } from '@apollo/client';

export const CREATE_ROOM = gql`
  mutation CreateRoom($name: String!) {
    createRoom(name: $name) {
      id
      name
      participantCount
      createdAt
    }
  }
`;