import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const host = request.headers.get('host') || '';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const url = `${protocol}://${host}`;

    // Check if service worker file exists
    const swUrl = `${url}/sw.js`;
    let swExists = false;
    try {
      const swResponse = await fetch(swUrl);
      swExists = swResponse.ok;
    } catch (error) {
      logger.debug('PWA Debug: Service worker not accessible:', error);
    }

    // Check if manifest file exists
    const manifestUrl = `${url}/manifest.json`;
    let manifestExists = false;
    try {
      const manifestResponse = await fetch(manifestUrl);
      manifestExists = manifestResponse.ok;
    } catch (error) {
      logger.debug('PWA Debug: Manifest not accessible:', error);
    }

    const pwaStatus = {
      timestamp: new Date().toISOString(),
      userAgent,
      host,
      protocol,
      url,
      requirements: {
        hasServiceWorker:
          'serviceWorker' in (globalThis as Record<string, unknown>),
        hasManifest: manifestExists,
        isHTTPS:
          protocol === 'https' ||
          host === 'localhost' ||
          host.startsWith('192.168.'),
        hasIcons: true, // We know icons exist
        isOnline: true,
        swExists,
        manifestExists,
      },
      mobile: {
        isMobile:
          /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            userAgent
          ),
        isChrome: /Chrome/i.test(userAgent) || /CriOS/i.test(userAgent),
        isChromeIOS: /CriOS/i.test(userAgent),
        isSafari:
          /Safari/i.test(userAgent) &&
          !(/Chrome/i.test(userAgent) || /CriOS/i.test(userAgent)),
        isFirefox: /Firefox/i.test(userAgent),
      },
    };

    logger.debug('PWA Status Check:', JSON.stringify(pwaStatus, null, 2));

    return NextResponse.json(pwaStatus);
  } catch (error) {
    logger.error('PWA Status Check Error:', error);
    return NextResponse.json(
      { error: 'Failed to check PWA status' },
      { status: 500 }
    );
  }
}
