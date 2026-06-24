import { Component, inject } from '@angular/core';
import { FirebaseApi } from '../../../../services/api/firebase-api/firebase-api';
import { GoogleIcon } from '../../../../icons/google-icon/google-icon';
import { AppleIcon } from '../../../../icons/apple-icon/apple-icon';
import { FacebookIcon } from '../../../../icons/facebook-icon/facebook-icon';
import { GithubIcon } from '../../../../icons/github-icon/github-icon';
import { AuthStore } from '../../../../services/store/auth-store/auth-store';
import { LoginProviders } from '../../../../enum/loginProviders.enum';

@Component({
  selector: 'app-external-providers',
  imports: [GoogleIcon, AppleIcon, FacebookIcon, GithubIcon],
  templateUrl: './external-providers.html',
  styleUrl: './external-providers.css',
})
export default class ExternalProviders {
  authStore = inject(AuthStore);
  buttons = Object.values(LoginProviders)
  onLoginProvider(name: LoginProviders) {
    this.authStore.loginFirebaseWithProvider(name);
  }
}
