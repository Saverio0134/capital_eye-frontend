import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MotionOptions } from '@primeuix/motion';
import { ToastModule } from 'primeng/toast';
import { API_ERROR_TOAST_KEY } from '../../../services/api-error-toast/api-error-toast';
@Component({
  selector: 'app-api-error-toast',
  imports: [ToastModule],
  templateUrl: './api-error-toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiErrorToast {
  readonly apiErrorToastKey = API_ERROR_TOAST_KEY;
  readonly apiErrorToastLife = 5000;
  readonly apiErrorToastBreakpoints: Record<string, Record<string, string>> = {
    '640px': {
      width: 'calc(100vw - 2rem)',
      left: '1rem',
      right: '1rem',
      transform: 'translateX(0)',
    },
  };
  readonly apiErrorToastMotionOptions: MotionOptions = {
    type: 'animation',
    enterClass: {
      active: 'ce-toast-enter',
    },
    leaveClass: {
      active: 'ce-toast-leave',
    },
  };
}
