import { gql } from '@apollo/client';

export const GET_BOARD_HISTORY = gql`
  query GetBoardHistory($roomId: ID!) {
    boardHistory(roomId: $roomId) {
      id
      userId
      eventType
      coordinates
      color
      timestamp
    }
  }
`;
