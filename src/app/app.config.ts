import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Nora from '@primeuix/themes/nora';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { apiErrorInterceptor } from './interceptors/api-error.interceptor';
import { AuthStore } from './services/store/auth-store/auth-store';
export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () => {
      const authStore = inject(AuthStore);
      // await new Promise((resolveInner) => {
      //   setTimeout(resolveInner, 2000);
      // });

      return authStore.bootstrapAuth();
    }),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor]), withFetch()),
    MessageService,
    providePrimeNG({
      zIndex: {
        modal: 4000,
        overlay: 3000,
        menu: 3000,
        tooltip: 4100,
      },
      theme: {
        preset: Nora,
        options: {
          darkModeSelector: '.dark',
          // TODO verificare se è corretto
          cssLayer: {
            name: 'primeng',
            order: 'app-styles, primeng',
          },
        },
      },
    }),
  ],
};
