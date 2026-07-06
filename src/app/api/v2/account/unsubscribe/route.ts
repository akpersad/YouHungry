import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeEmailByToken } from '@/lib/v2/account';
import { v2ErrorResponse } from '@/lib/v2/http';

/**
 * The List-Unsubscribe target (RFC 8058 one-click): mail clients POST here
 * with the token from the message headers — no session, the signed token
 * is the authorization. Humans never see this route; the visible footer
 * link goes to the /unsubscribe page instead. GET redirects there so a
 * client that opens the header URI still lands somewhere honest.
 */

export async function POST(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') ?? '';
    const done = await unsubscribeEmailByToken(token);
    // 200 either way a mail client cares about; an invalid token is the
    // only genuine rejection worth signaling.
    if (!done) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    }
    return NextResponse.json({ unsubscribed: true });
  } catch (error) {
    return v2ErrorResponse('account:unsubscribe', error);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const url = new URL('/unsubscribe', request.url);
  if (token) url.searchParams.set('token', token);
  return NextResponse.redirect(url, 303);
}
