/**
 * v2 error taxonomy. A `V2DomainError` is a rule rejection whose message is
 * written for the user ("Fork is no longer open") — the API maps it to a
 * 4xx with the message intact. Anything else that escapes a handler is an
 * infrastructure failure: it becomes a generic 500 and the real error goes
 * to the logger, never the response body.
 */
export class V2DomainError extends Error {
  readonly status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'V2DomainError';
    this.status = status;
  }
}

export function notFound(what: string): V2DomainError {
  return new V2DomainError(`${what} not found`, 404);
}
