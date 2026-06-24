import { Component, inject, signal } from '@angular/core';
import { LandmarkIcon } from 'lucide-angular';
import { AuthStore } from '../../services/store/auth-store/auth-store';
import {
  NavigationAction,
  PRIMARY_NAVIGATION_ITEMS,
  SECONDARY_NAVIGATION_ACTION_ITEMS,
  SECONDARY_NAVIGATION_ITEMS,
} from './config/navigation.config';
import NavigationMobileMenu from './components/mobile-menu/mobile-menu';
import NavigationSidebar from './components/sidebar/sidebar';

@Component({
  selector: 'app-navigation',
  imports: [NavigationSidebar, NavigationMobileMenu],
  templateUrl: './navigation.html',
})
export default class Navigation {
  readonly brandIcon = LandmarkIcon;
  readonly primaryItems = PRIMARY_NAVIGATION_ITEMS;
  readonly secondaryItems = SECONDARY_NAVIGATION_ITEMS;
  readonly secondaryActions = SECONDARY_NAVIGATION_ACTION_ITEMS;
  readonly isMoreMenuOpen = signal(false);

  private readonly authStore = inject(AuthStore);

  openMoreMenu(): void {
    this.isMoreMenuOpen.set(true);
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen.set(false);
  }

  handleAction(action: NavigationAction): void {
    this.closeMoreMenu();

    if (action === 'logout') {
      void this.authStore.logout();
    }
  }
}
