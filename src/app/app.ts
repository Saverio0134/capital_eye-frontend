import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MotionOptions } from '@primeuix/motion';
import { ToastModule } from 'primeng/toast';
import { API_ERROR_TOAST_KEY } from './services/api-error-toast/api-error-toast';
import { AuthStore } from './services/store/auth-store/auth-store';
import { ApiErrorToast } from './shared/components/api-error-toast/api-error-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ApiErrorToast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly authStore = inject(AuthStore);

  // Avvia il listener auth globale all'avvio della shell.
  constructor() {
    this.authStore.startAuthListener();
  }

  // Rimuove il loader SSR iniziale una volta montata l'app.
  ngOnInit(): void {
    document.getElementById('loadingScreen')?.remove();
  }
}
