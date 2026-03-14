import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { getToken } from '../auth/authStorage';

const hostname = window.location.hostname;
const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

const httpUri = `http://${hostname}:5000/graphql/`;
const wsUri = `${wsProtocol}://${hostname}:5000/graphql/`;

console.log('Apollo HTTP URI:', httpUri);
console.log('Apollo WS URI:', wsUri);

const httpLink = new HttpLink({
  uri: httpUri,
});

const authLink = setContext((_, { headers }) => {
  const token = getToken();

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
    connectionParams: () => {
      const token = getToken();
      return token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default apolloClient;