import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { LucideAngularModule, LandmarkIcon } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import ExternalProviders from '../external-providers/external-providers';
import { AuthStore } from '../../../../services/store/auth-store/auth-store';
import { AuthForm } from '../../../../services/api/firebase-api/firebase-api';
import { invalidField } from '../../../../utils/form-field.utils';

@Component({
  selector: 'app-login',
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    LucideAngularModule,
    RouterLink,
    ExternalProviders,
    FormField,
    FormRoot,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Login {
  readonly LandmarkIcon = LandmarkIcon;
  readonly invalidField = invalidField;

  private readonly authStore = inject(AuthStore);

  readonly loginFormModel = signal<AuthForm>({
    email: '',
    password: '',
  });

  readonly loginForm = form(
    this.loginFormModel,
    (login) => {
      required(login.email, { message: 'Email obbligatoria' });
      email(login.email, { message: 'Email non valida' });
      required(login.password, { message: 'Password obbligatoria' });
    },
    {
      submission: {
        action: async () => await this.authStore.loginFirebaseWithCredential(this.loginFormModel()),
      },
    },
  );
}
