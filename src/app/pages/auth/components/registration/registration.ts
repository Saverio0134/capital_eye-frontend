import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthForm } from '../../../../services/api/firebase-api/firebase-api';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import ExternalProviders from '../external-providers/external-providers';
import { AuthStore } from '../../../../services/store/auth-store/auth-store';
import { invalidField } from '../../../../utils/form-field.utils';

@Component({
  selector: 'app-registration',
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
  templateUrl: './registration.html',
  styleUrl: './registration.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Registration {
  readonly invalidField = invalidField;

  private readonly authStore = inject(AuthStore);

  readonly registrationFormModel = signal<AuthForm>({
    email: '',
    password: '',
  });

  readonly registrationForm = form(
    this.registrationFormModel,
    (registration) => {
      required(registration.email, { message: 'Email obbligatoria' });
      email(registration.email, { message: 'Email non valida' });
      required(registration.password, { message: 'Password obbligatoria' });
    },
    {
      submission: {
        action: async () => await this.authStore.register(this.registrationFormModel()),
      },
    },
  );
}
