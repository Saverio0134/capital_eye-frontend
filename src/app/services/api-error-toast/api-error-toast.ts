import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiErrorToastPayload } from '../../models/api-error.model';

export const API_ERROR_TOAST_KEY = 'api-error-toast';
const API_ERROR_TOAST_LIFE = 5000;

@Injectable({
  providedIn: 'root',
})
export class ApiErrorToastService {
  private readonly messageService = inject(MessageService);

  show(error: ApiErrorToastPayload): void {
    console.error('API error', error);
    this.messageService.add({
      key: API_ERROR_TOAST_KEY,
      severity: 'error',
      summary: 'Operazione non riuscita',
      detail: error.detail,
      life: API_ERROR_TOAST_LIFE,
      data: error,
      contentStyleClass: 'p-2',
      closable: false,
    });
  }
}
