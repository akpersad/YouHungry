import { NextRequest } from 'next/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';

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

const handler = startServerAndCreateNextHandler<NextRequest>(server);

export { handler as GET, handler as POST };
