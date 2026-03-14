import { gql } from '@apollo/client';

export const SEND_DRAWING_EVENT = gql`
  mutation SendDrawingEvent($input: DrawingEventInput!) {
    sendDrawingEvent(input: $input) {
      success
    }
  }
`;
