import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  Routes,
} from '@angular/router';
import { AuthStore } from './services/store/auth-store/auth-store';

const authGuard: CanActivateFn = () => {
  return !!inject(AuthStore).authToken();
};
const guestGuard: CanActivateFn = () => {
  return !!!inject(AuthStore).authToken();
};
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/logged-layout/logged-layout'),
    canMatch: [authGuard],
    // TODO capire se ha senso usare il resolver
    // resolve: {
    //   assetsReady: () => {
    //     const assetStore = inject(AssetStore);
    //     return toObservable(assetStore.isLoading).pipe(
    //       filter((isLoading) => !isLoading),
    //       take(1),
    //       map(() => true)
    //     );
    //   },
    // },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard'),
      },
      {
        path: 'assets',
        loadComponent: () => import('./pages/assets/assets'),
      },
      {
        path: 'liquidity',
        loadComponent: () => import('./pages/liquidity/liquidity'),
      },
      {
        path: 'current-accounts',
        loadComponent: () => import('./pages/current-accounts/current-accounts'),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./pages/transactions/transactions'),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings'),
      },

      { path: '**', redirectTo: '/dashboard' },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/guest-layout/guest-layout'),
    canMatch: [guestGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/auth/auth'),
        children: [
          {
            path: 'login',
            loadComponent: () => import('./pages/auth/components/login/login'),
          },
          {
            path: 'registration',
            loadComponent: () => import('./pages/auth/components/registration/registration'),
          },
          { path: '**', redirectTo: '/login', pathMatch: 'full' },
        ],
      },
    ],
  },
];
