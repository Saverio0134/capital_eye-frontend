// server.ts predefinito del progetto: usa AngularAppEngine, compatibile con
// il runtime @netlify/angular-runtime e con il dev-server Angular.
// Per deployment Node/SSR autonomo con Express + CSP header, la configurazione
// `production` usa fileReplacements per scambiare questo file con server.express.ts.
import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getAllowedHosts, getContext, getTrustProxyHeaders } from '@netlify/angular-runtime/app-engine.js';

const angularAppEngine = new AngularAppEngine({
  allowedHosts: getAllowedHosts(),
  trustProxyHeaders: getTrustProxyHeaders(),
});

// Handler richiesto dal runtime Netlify: riceve una Request e restituisce Response.
export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext();

  const result = await angularAppEngine.handle(request, context);
  return result || new Response('Not found', { status: 404 });
}

// Request handler usato dall'Angular CLI (dev-server e build).
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);