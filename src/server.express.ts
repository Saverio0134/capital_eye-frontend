// server.ts Express per deployment Node/SSR autonomo (production).
// Centralizza header di sicurezza (CSP, HSTS, ecc.) e serving static file via Express.
// E scambiato via fileReplacements nella configurazione `production`.
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Origine del backend API, derivata da environment.apiUrl (es. https://host/api -> https://host)
const apiOrigin = new URL(environment.apiUrl).origin;
const firebaseAuthOrigin = `https://${environment.firebase.authDomain}`;

// Header di sicurezza applicati a tutte le risposte.
// La CSP e calibrata su Angular (stili inline dei componenti) e Firebase Auth
// (signInWithPopup usa un iframe verso authDomain e chiama le API Google Identity).
const contentSecurityPolicy = [
  `default-src 'self'`,
  // 'unsafe-inline' e richiesto dalla build di produzione Angular: l'handler
  // onload del critical CSS inlining e lo script inline dell'event replay (SSR)
  // verrebbero altrimenti bloccati.
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://graph.facebook.com`,
  `font-src 'self' data:`,
  `connect-src 'self' ${apiOrigin} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebaseinstallations.googleapis.com`,
  `frame-src ${firebaseAuthOrigin}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join('; ');

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', contentSecurityPolicy);
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Express non deve dichiarare la propria versione nelle risposte.
app.disable('x-powered-by');

// Serve static files from /browser
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// Handle all other requests by rendering the Angular application.
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// Start the server if this module is the main entry point, or it is ran via PM2.
// The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
export const reqHandler = createNodeRequestHandler(app);