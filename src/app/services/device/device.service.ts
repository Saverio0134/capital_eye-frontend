import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isMobile = signal(
    isPlatformBrowser(this.platformId) &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  );
}
