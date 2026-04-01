import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { getToken } from '../auth/authStorage';

const hostname = window.location.hostname;
const httpProtocol = window.location.protocol === 'https:' ? 'https' : 'http';
const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

const httpUri = `${httpProtocol}://${hostname}:5000/graphql/`;
const wsUri = `${wsProtocol}://${hostname}:5000/graphql/`;

console.log('Apollo HTTP URI:', httpUri);
console.log('Apollo WS URI:', wsUri);

function isTokenExpired(token) {
  try {
    if (!token) return true;

    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;

    return payload.exp * 1000 <= Date.now();
  } catch (error) {
    console.error('Failed to parse token:', error);
    return true;
  }
}

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('whiteboard_user');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

const httpLink = new HttpLink({
  uri: httpUri,
});

const authLink = setContext((_, { headers }) => {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    console.warn('JWT expired before HTTP request. Redirecting to login.');
    clearAuthAndRedirect();

    return {
      headers: {
        ...headers,
      },
    };
  }

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      const message = error?.message || '';

      if (
        message.includes('Signature has expired') ||
        message.includes('expired') ||
        message.includes('Unauthorized') ||
        message.includes('Invalid token')
      ) {
        console.warn('GraphQL auth error:', message);
        clearAuthAndRedirect();
        return;
      }
    }
  }

  if (networkError) {
    console.error('Network error:', networkError);
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
    retryAttempts: 5,
    shouldRetry: () => {
      const token = getToken();

      if (!token || isTokenExpired(token)) {
        console.warn('WS retry blocked because token is missing or expired.');
        return false;
      }

      return true;
    },
    connectionParams: () => {
      const token = getToken();

      if (!token || isTokenExpired(token)) {
        console.warn('JWT expired before WS connection. Redirecting to login.');
        clearAuthAndRedirect();
        return {};
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    },
    on: {
      connected: () => {
        console.log('WebSocket connected');
      },
      closed: (event) => {
        console.warn('WebSocket closed:', event);

        if (
          event?.reason?.includes('Signature has expired') ||
          event?.reason?.includes('Unauthorized') ||
          event?.code === 4401 ||
          event?.code === 4403
        ) {
          clearAuthAndRedirect();
        }
      },
      error: (error) => {
        console.error('WebSocket error:', error);
      },
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
  ApolloLink.from([errorLink, authLink, httpLink])
);

const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default apolloClient;