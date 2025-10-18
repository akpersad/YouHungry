#!/usr/bin/env node

/**
 * HTTPS Production Server
 *
 * Runs Next.js production build with HTTPS using self-signed certificates
 * This is for local testing only - production deployments should use proper SSL
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = 'forkintheroad.local';
const port = process.env.PORT || 3000;

// Paths to certificates
const certPath = path.join(process.cwd(), 'public', 'cert.pem');
const keyPath = path.join(process.cwd(), 'public', 'cert-key.pem');

// Check if certificates exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('❌ SSL certificates not found!');
  console.error('   Generate with:');
  console.error(
    '   openssl req -x509 -newkey rsa:4096 -keyout public/cert-key.pem -out public/cert.pem -days 365 -nodes'
  );
  process.exit(1);
}

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https
    .createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    })
    .listen(port, (err) => {
      if (err) throw err;
      console.log(`✅ HTTPS Server ready on https://${hostname}:${port}`);
      console.log(
        `⚠️  Using self-signed certificates - browsers will show security warnings`
      );
    });
});
