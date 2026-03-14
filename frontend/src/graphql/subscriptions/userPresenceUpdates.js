import { gql } from '@apollo/client';

export const USER_PRESENCE_UPDATES = gql`
  subscription OnUserPresenceUpdate($roomId: ID!) {
    userPresenceUpdates(roomId: $roomId) {
      userId
      online
      lastSeen
    }
  }
`;
