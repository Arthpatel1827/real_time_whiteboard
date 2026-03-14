import { gql } from '@apollo/client';

export const DRAWING_UPDATES = gql`
  subscription OnDrawingUpdate($roomId: ID!) {
    drawingUpdates(roomId: $roomId) {
      id
      userId
      eventType
      coordinates
      color
      timestamp
    }
  }
`;
