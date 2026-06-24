// Dispatcher URL -> handler per l'interceptor mock.
// Mappa ogni endpoint backend a una funzione che legge/scrive il mock-db e
// restituisce un HttpResponse body (o void per 204) con status appropriato.
import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { mockDb } from './mock-db';

// Latenza simulata per renderare la demo piu realistica (ms).
const MOCK_LATENCY_MS = 120;

// Parsing robusto del path relativo: usa un origin fittizio per ottenere solo la parte pathname.
function resolvePath(url: string): string {
  if (url.startsWith('http')) {
    return new URL(url).pathname;
  }
  return new URL(url, 'http://mock.local').pathname;
}

// Esegue un handler e trasforma l'esito inHttpResponse, gestendo 204/404.
function respondWith(body: unknown, status = 200): Observable<HttpEvent<unknown>> {
  const response =
    status === 204
      ? new HttpResponse({ status, body: null })
      : new HttpResponse({ status, body });
  return of(response).pipe(delay(MOCK_LATENCY_MS));
}

// Legge il body come record tipizzato fallback sicuro.
function readBody(req: HttpRequest<unknown>): Record<string, unknown> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

// Router principale: dato method + path individua l'handler da eseguire.
function handleRequest(
  method: string,
  path: string,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> | null {
  switch (true) {
    case method === 'GET' && path === '/api/user':
      return respondWith(mockDb.user);

    case method === 'POST' && path.startsWith('/api/user/set-name/'): {
      const name = decodeURIComponent(path.replace('/api/user/set-name/', ''));
      mockDb.setUserName(name);
      return respondWith({ ok: true });
    }

    case method === 'GET' && path === '/api/financial-accounts':
      return respondWith(mockDb.getFinancialAccounts());

    case method === 'POST' && path === '/api/financial-accounts':
      return respondWith(mockDb.createFinancialAccount(readBody(req)), 201);

    case method === 'PUT' && path.startsWith('/api/financial-accounts/'): {
      const uuid = path.replace('/api/financial-accounts/', '');
      const updated = mockDb.updateFinancialAccount(uuid, readBody(req));
      return updated ? respondWith(updated) : respondNotFound();
    }

    case method === 'DELETE' && path.startsWith('/api/financial-accounts/'): {
      const uuid = path.replace('/api/financial-accounts/', '');
      return mockDb.deleteFinancialAccount(uuid) ? respondWith(null, 204) : respondNotFound();
    }

    case method === 'GET' && path === '/api/financial-accounts/snapshot-net-worth':
      return respondWith(mockDb.getSnapshotNetWorth());

    case method === 'GET' && path === '/api/assets':
      return respondWith(mockDb.getAllAssetsWithNet());

    case method === 'GET' && path.startsWith('/api/assets/monthly-variations'):
      return respondWith(mockDb.getMonthlyVariations());

    case method === 'POST' && path === '/api/assets':
      return respondWith(mockDb.createAsset(readBody(req)), 201);

    case method === 'PUT' && path.startsWith('/api/assets/'): {
      const remaining = path.replace('/api/assets/', '');
      const [uuid] = remaining.split('/positions/');
      const updated = mockDb.updateAsset(uuid, readBody(req));
      return updated ? respondWith(updated) : respondNotFound();
    }

    case method === 'DELETE' && path.includes('/positions/'): {
      const segments = path.replace('/api/assets/', '').split('/positions/');
      const assetUuid = segments[0];
      const positionUuid = segments[1];
      return mockDb.deleteAssetPosition(assetUuid, positionUuid) ? respondWith(null, 204) : respondNotFound();
    }

    case method === 'DELETE' && path.startsWith('/api/assets/'): {
      const uuid = path.replace('/api/assets/', '');
      return mockDb.deleteAsset(uuid) ? respondWith(null, 204) : respondNotFound();
    }

    case method === 'GET' && path === '/api/liquidity-snapshots':
      return respondWith(mockDb.getLiquiditySnapshots());

    case method === 'GET' && path === '/api/liquidity-snapshots/total-amount-latest':
      return respondWith(mockDb.getTotalLatestLiquidity());

    case method === 'GET' && path === '/api/liquidity-snapshots/monthly-table':
      return respondWith(mockDb.getMonthlyTable());

    case method === 'POST' && path === '/api/liquidity-snapshots':
      return respondWith(mockDb.createLiquiditySnapshot(readBody(req)), 201);

    case method === 'DELETE' && path.startsWith('/api/liquidity-snapshots/'): {
      const uuid = path.replace('/api/liquidity-snapshots/', '');
      return mockDb.deleteLiquiditySnapshot(uuid) ? respondWith(null, 204) : respondNotFound();
    }

    case method === 'GET' && path === '/api/transactions':
      return respondWith(mockDb.getTransactions());

    case method === 'POST' && path === '/api/transactions':
      return respondWith(mockDb.createTransaction(readBody(req)), 201);

    case method === 'DELETE' && path.startsWith('/api/transactions/'): {
      const uuid = path.replace('/api/transactions/', '');
      return mockDb.deleteTransaction(uuid) ? respondWith(null, 204) : respondNotFound();
    }

    default:
      return null;
  }
}

// Risposta 404 standard quando l'handler non trova la risorsa.
function respondNotFound(): Observable<HttpEvent<unknown>> {
  const response = new HttpResponse({
    status: 404,
    body: { code: 'NOT_FOUND', detail: 'Risorsa demo non trovata' },
  });
  return of(response).pipe(delay(MOCK_LATENCY_MS));
}

// Router esposto: ritorna Observable quando un handler esiste, null altrimenti.
export function routeMockRequest(
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> | null {
  const method = req.method.toUpperCase();
  const path = resolvePath(req.url);
  return handleRequest(method, path, req);
}

// Entry point interceptor funzionale: intercetta, instrada e cortocircuita.
export function mockHttpInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const handled = routeMockRequest(req);
  return handled ?? next(req);
}