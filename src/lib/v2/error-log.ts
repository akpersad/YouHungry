import type { ObjectId } from 'mongodb';
import { logger } from '../logger';
import { getV2Db } from './db';
import { V2_COLLECTIONS } from './schema';

/**
 * Minimal server-error capture — the "errors" half of the minimal admin
 * page (WORKPLAN Phase 7). One insert per unexpected 500 on the /api/v2
 * surface, 30-day TTL (index in schema.ts), fire-and-forget: recording an
 * error must never fail or slow the request that hit it. A hosted error
 * tracker can replace this wholesale; the seam is this one function.
 */

export interface ServerErrorDoc {
  _id?: ObjectId;
  route: string;
  message: string;
  stack?: string;
  at: Date;
}

export function recordServerError(route: string, error: unknown): void {
  void (async () => {
    try {
      const { db } = await getV2Db();
      const doc: ServerErrorDoc = {
        route,
        message: error instanceof Error ? error.message : String(error),
        at: new Date(),
      };
      if (error instanceof Error && error.stack) {
        doc.stack = error.stack.slice(0, 4000);
      }
      await db
        .collection<ServerErrorDoc>(V2_COLLECTIONS.errorLogs)
        .insertOne(doc);
    } catch (logError) {
      logger.warn('recordServerError: write failed', { logError });
    }
  })();
}
