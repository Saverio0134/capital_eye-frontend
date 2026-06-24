import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp, FirebaseOptions } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  User as UserFirebase,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  signOut,
  onIdTokenChanged,
} from 'firebase/auth';
import { UserApi } from '../user-api/user-api';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuthForm {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

// firebase console -> impostazioni progetto -> generali (giu Le tue app)
const firebaseConfig = environment.firebase

@Injectable({
  providedIn: 'root',
})
export class FirebaseApi {
  private readonly auth = getAuth(initializeApp(firebaseConfig));
  // onIdTokenChanged emette anche al rinnovo silenzioso del token (ogni ora), non solo su login/logout.
  authState$ = new Observable<UserFirebase | null>((subscriber) => {
    return onIdTokenChanged(this.auth, (user) => {
      subscriber.next(user);
    });
  });

  login(loginForm: AuthForm) {
    return signInWithEmailAndPassword(this.auth, loginForm.email, loginForm.password);
  }
  getProvider(name: string) {
    switch (name) {
      case 'google':
        return new GoogleAuthProvider();
      case 'apple':
        return new OAuthProvider('apple.com');
      case 'github':
        return new GithubAuthProvider();
      case 'facebook':
        return new FacebookAuthProvider();
      default:
        return null;
    }
  }
  loginWithProvider(name: string) {
    const provider = this.getProvider(name);
    if (!provider) {
      console.error(`Provider ${name} not supported`);
      return;
    }

    return signInWithPopup(this.auth, provider);
  }

  register(registerForm: AuthForm) {
    return createUserWithEmailAndPassword(this.auth, registerForm.email, registerForm.password);
  }

  logout() {
    return signOut(this.auth);
  }
}
