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
      async requestDidStart() {
        return {
          async willSendResponse(requestContext: unknown) {
            if (process.env.NODE_ENV === 'development') {
              const context = requestContext as {
                request: { operationName?: string; variables?: unknown };
                response: {
                  body: { kind: string; singleResult: { errors?: unknown } };
                };
              };
              console.log('GraphQL Response:', {
                operationName: context.request.operationName,
                variables: context.request.variables,
                errors:
                  context.response.body.kind === 'single'
                    ? context.response.body.singleResult.errors
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
