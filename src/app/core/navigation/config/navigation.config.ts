import {
  ArrowLeftRightIcon,
  ChartCandlestickIcon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  LucideIconData,
  SettingsIcon,
} from 'lucide-angular';

export type NavigationPlacement = 'primary' | 'secondary';
export type NavigationAction = 'logout';

export interface NavigationRouteItem {
  id: string;
  label: string;
  mobileLabel: string;
  routerLink: string;
  icon: LucideIconData;
  placement: NavigationPlacement;
}

export interface NavigationActionItem {
  id: string;
  label: string;
  icon: LucideIconData;
  action: NavigationAction;
  placement: NavigationPlacement;
}

export const NAVIGATION_ROUTE_ITEMS: readonly NavigationRouteItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    mobileLabel: 'Home',
    routerLink: '/dashboard',
    icon: LayoutDashboardIcon,
    placement: 'primary',
  },
  {
    id: 'assets',
    label: 'Assets',
    mobileLabel: 'Assets',
    routerLink: '/assets',
    icon: ChartCandlestickIcon,
    placement: 'primary',
  },
  {
    id: 'liquidita',
    label: 'Liquidità',
    mobileLabel: 'Cash',
    routerLink: '/liquidity',
    icon: CircleDollarSignIcon,
    placement: 'primary',
  },
  {
    id: 'transactions',
    label: 'Registro',
    mobileLabel: 'Registro',
    routerLink: '/transactions',
    icon: ArrowLeftRightIcon,
    placement: 'primary',
  },
  {
    id: 'settings',
    label: 'Impostazioni',
    mobileLabel: 'Settings',
    routerLink: '/settings',
    icon: SettingsIcon,
    placement: 'secondary',
  },
] as const;

export const NAVIGATION_ACTION_ITEMS: readonly NavigationActionItem[] = [
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOutIcon,
    action: 'logout',
    placement: 'secondary',
  },
] as const;

export const PRIMARY_NAVIGATION_ITEMS = NAVIGATION_ROUTE_ITEMS.filter(
  (item) => item.placement === 'primary',
);

export const SECONDARY_NAVIGATION_ITEMS = NAVIGATION_ROUTE_ITEMS.filter(
  (item) => item.placement === 'secondary',
);

export const SECONDARY_NAVIGATION_ACTION_ITEMS = NAVIGATION_ACTION_ITEMS.filter(
  (item) => item.placement === 'secondary',
);
