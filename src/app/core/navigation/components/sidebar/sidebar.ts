import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { ButtonDirective } from 'primeng/button';
import {
  NavigationAction,
  NavigationActionItem,
  NavigationRouteItem,
} from '../../config/navigation.config';

@Component({
  selector: 'app-navigation-sidebar',
  imports: [LucideAngularModule, RouterLink, RouterLinkActive, ButtonDirective],
  templateUrl: './sidebar.html',
})
export default class NavigationSidebar {
  readonly brandIcon = input.required<LucideIconData>();
  readonly primaryItems = input.required<readonly NavigationRouteItem[]>();
  readonly secondaryItems = input.required<readonly NavigationRouteItem[]>();
  readonly secondaryActions = input.required<readonly NavigationActionItem[]>();
  readonly actionTriggered = output<NavigationAction>();

  onAction(action: NavigationAction): void {
    this.actionTriggered.emit(action);
  }
}
