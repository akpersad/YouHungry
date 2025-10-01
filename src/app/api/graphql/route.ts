import { logger } from '@/lib/logger';
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
              logger.debug('GraphQL Response:', {
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

const handler = startServerAndCreateNextHandler(server);

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
