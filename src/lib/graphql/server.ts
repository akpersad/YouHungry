import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV === 'development',
  plugins: [
    // Add logging plugin for development
    {
      requestDidStart() {
        return {
          willSendResponse(requestContext) {
            if (process.env.NODE_ENV === 'development') {
              console.log('GraphQL Response:', {
                operationName: requestContext.request.operationName,
                variables: requestContext.request.variables,
                errors:
                  requestContext.response.body.kind === 'single'
                    ? requestContext.response.body.singleResult.errors
                    : null,
              });
            }
          },
        };
      },
    },
  ],
});

export default startServerAndCreateNextHandler(server);
