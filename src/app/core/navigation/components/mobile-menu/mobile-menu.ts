import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EllipsisIcon, LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import {
  NavigationAction,
  NavigationActionItem,
  NavigationRouteItem,
} from '../../config/navigation.config';

@Component({
  selector: 'app-navigation-mobile-menu',
  imports: [LucideAngularModule, RouterLink, RouterLinkActive, ButtonDirective, Drawer],
  templateUrl: './mobile-menu.html',
})
export default class NavigationMobileMenu {
  readonly moreIcon = EllipsisIcon;
  readonly primaryItems = input.required<readonly NavigationRouteItem[]>();
  readonly secondaryItems = input.required<readonly NavigationRouteItem[]>();
  readonly secondaryActions = input.required<readonly NavigationActionItem[]>();
  readonly moreMenuOpen = input.required<boolean>();
  readonly openMoreRequested = output<void>();
  readonly closeMoreRequested = output<void>();
  readonly actionTriggered = output<NavigationAction>();

  requestDrawerState(visible: boolean): void {
    if (visible) {
      this.openMoreRequested.emit();
      return;
    }

    this.closeMoreRequested.emit();
  }

  onAction(action: NavigationAction): void {
    this.actionTriggered.emit(action);
  }

  closeDrawer(): void {
    this.closeMoreRequested.emit();
  }
}
