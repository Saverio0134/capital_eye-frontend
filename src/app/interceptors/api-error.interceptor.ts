import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiErrorPayload } from '../models/api-error.model';
import { ApiErrorToastService } from '../services/api-error-toast/api-error-toast';

// Intercetta gli errori del backend `/api`, mostra `detail` nel toast globale e rilancia l'errore.
export function apiErrorInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const apiErrorToastService = inject(ApiErrorToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isApiRequest(req.url)) {
        const payload = extractApiErrorPayload(error.error);

        apiErrorToastService.show({
          code: payload?.code ?? null,
          detail: resolveApiErrorDetail(error, payload),
          status: error.status,
          url: error.url ?? req.url,
        });
      }

      return throwError(() => error);
    }),
  );
}

// Verifica se la richiesta è diretta al backend applicativo `/api`.
function isApiRequest(url: string): boolean {
  const normalizedApiUrl = environment.apiUrl.replace(/\/$/, '');

  return url.startsWith(normalizedApiUrl) || url.startsWith('/api');
}

// Estrae il payload errore standardizzato del backend quando presente.
function extractApiErrorPayload(errorBody: unknown): ApiErrorPayload | null {
  return isApiErrorPayload(errorBody) ? errorBody : null;
}

// Riconosce il nuovo contratto `{ code, detail }` senza leggere `message`.
function isApiErrorPayload(errorBody: unknown): errorBody is ApiErrorPayload {
  if (typeof errorBody !== 'object' || errorBody === null) {
    return false;
  }

  const candidate = errorBody as Record<string, unknown>;

  return typeof candidate['code'] === 'string' && typeof candidate['detail'] === 'string';
}

// Deriva il testo utente finale preferendo sempre `detail`.
function resolveApiErrorDetail(error: HttpErrorResponse, payload: ApiErrorPayload | null): string {
  if (payload?.detail.trim()) {
    return payload.detail.trim();
  }

  if (error.status === 0) {
    return 'Impossibile raggiungere il server. Riprova tra poco.';
  }

  return 'Si è verificato un errore interno.';
}
