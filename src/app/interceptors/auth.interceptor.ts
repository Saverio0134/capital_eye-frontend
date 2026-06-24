import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthStore } from '../services/store/auth-store/auth-store';

// Aggiunge il bearer token alle richieste backend quando disponibile.
// Chiama getIdToken() sull'oggetto User Firebase ad ogni richiesta: l'SDK rinnova
// silenziosamente il token se scaduto, evitando 403 dopo lunghi periodi di standby.
export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authStore = inject(AuthStore);
  const user = authStore.firebaseUser();

  // Allowlist: il token va allegato solo alle richieste verso il nostro backend,
  // mai a host terzi (eviterebbe leak del bearer token).
  if (!user || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // getIdToken() restituisce il token dalla cache se ancora valido, altrimenti lo rinnova.
  return from(user.getIdToken()).pipe(
    switchMap((token) => {
      const newReq = req.clone({
        headers: req.headers.append('Authorization', `Bearer ${token}`),
      });
      return next(newReq);
    }),
  );
}
