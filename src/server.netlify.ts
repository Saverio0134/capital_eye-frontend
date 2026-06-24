// server.ts compatibile Netlify per la modalita demo.
// Usa AngularAppEngine (non Express) richiesto dal runtime @netlify/angular-runtime.
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