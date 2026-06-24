import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { UserApi } from '../../api/user-api/user-api';
import { AuthForm, FirebaseApi } from '../../api/firebase-api/firebase-api';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { LoginProviders } from '../../../enum/loginProviders.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private userApi = inject(UserApi);
  private firebaseApi = inject(FirebaseApi);
  private router = inject(Router);
  readonly authToken = signal('');
  // Oggetto User Firebase esposto all'interceptor per chiamare getIdToken() fresco ad ogni richiesta.
  readonly firebaseUser = signal<User | null>(null);
  public readonly userData = signal<any | null>(null);
  private unsubscribeAuth?: Subscription;

  async bootstrapAuth(): Promise<void> {
    const user = await firstValueFrom(this.firebaseApi.authState$);
    await this.handleUser(user);
  }

  startAuthListener(): void {
    if (this.unsubscribeAuth) return;
    this.unsubscribeAuth = this.firebaseApi.authState$.subscribe((user) => {
      this.handleUser(user);
    });
  }

  private async handleUser(user: User | null) {
    if (user) {
      // Aggiorna sempre il token (gestisce anche i rinnovi silenziosi ogni ora).
      const isFirstLogin = !this.authToken();
      this.authToken.set(await user.getIdToken());
      // Mantiene il riferimento User aggiornato così l'interceptor può chiamare getIdToken() fresco.
      this.firebaseUser.set(user);
      // memoUser solo al primo login, non a ogni refresh del token.
      if (isFirstLogin) {
        this.memoUser();
      }
    } else {
      this.authToken.set('');
      this.firebaseUser.set(null);
      this.userData.set(null);
    }
  }

  async memoUser() {
    try {
      const user = await firstValueFrom(this.userApi.getUser());
      this.userData.set(user);
    } catch (error) {
      console.error(error);
      this.userData.set(null);
      this.router.navigateByUrl('/');
    }
  }

  async loginFirebaseWithCredential(form: AuthForm) {
    try {
      await this.firebaseApi.login(form);
      this.router.navigateByUrl('/dashboard');
    } catch (error) {
      console.error(error);
    }
  }

  async loginFirebaseWithProvider(name: LoginProviders) {
    try {
      const result = await this.firebaseApi.loginWithProvider(name);

      const isNew = result?.user.metadata.creationTime === result?.user.metadata.lastSignInTime;

      console.log(isNew ? 'Nuovo utente' : 'Utente esistente');

      this.router.navigateByUrl('/dashboard');
    } catch (error) {
      console.error(error);
    }
  }
  async register(registerForm: AuthForm) {
    try {
      await this.firebaseApi.register(registerForm);
    } catch (error) {
      console.error(error);
    }
  }

  async logout() {
    try {
      await this.firebaseApi.logout();
      this.router.navigateByUrl('/');
    } catch (error) {
      console.error(error);
    }
  }
}
