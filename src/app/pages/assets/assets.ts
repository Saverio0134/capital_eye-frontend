import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FunnelXIcon, LucideAngularModule, PlusIcon } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { AssetStore } from '../../services/store/asset-store/asset-store';
import { DistributionChart } from '../../shared/components/distribution-chart/distribution-chart';
import { TrendChart } from '../../shared/components/trend-chart/trend-chart';
import { Asset, AssetType, Currency, MonthlyAssetVariationPoint } from '../../models/asset.model';
import { MonthlyNetWorth } from '../../models/networth.model';
import { isPhysicalAssetType } from '../../utils/asset.utils';
import { AssetDetailsDialog } from './components/asset-details-dialog/asset-details-dialog';
import { AssetAccountsDialog } from './components/link-asset-account/link-asset-account';
import { SaveAsset } from './components/save-asset/save-asset';
import { AssetCreateMode } from './components/save-asset/save-asset.types';
import {
  ASSET_TYPE_FILTER_OPTIONS,
  ASSET_TYPE_LABELS,
} from '../../shared/config/select-options.config';

interface AssetTableRow extends Asset {
  performance: number;
  provider: string;
  providerNames: string[];
  monthlyVariations: MonthlyAssetVariationPoint[];
}

interface ChartSlice {
  label: string;
  value: number;
}

@Component({
  selector: 'app-assets-page',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    FormsModule,
    TableModule,
    SelectModule,
    ButtonModule,
    LucideAngularModule,
    DistributionChart,
    TrendChart,
    AssetDetailsDialog,
    AssetAccountsDialog,
    SaveAsset,
  ],
  templateUrl: './assets.html',
  styleUrl: './assets.css',
})
export default class AssetsPage implements OnInit, OnDestroy {
  // Icone per header e azioni tabella.
  readonly PlusIcon = PlusIcon;
  readonly FunnelXIcon = FunnelXIcon;
  readonly assetStore = inject(AssetStore);

  // Stato di caricamento globale della pagina.
  isGlobalLoading = computed(() => {
    return (
      this.assetStore.assetsResource().isLoading() ||
      this.assetStore.monthlyVariationsResource().isLoading()
    );
  });

  // Numero finto mostrato durante il caricamento.
  readonly randomNumber = signal(0);
  private intervalId?: ReturnType<typeof setInterval>;

  // Inizializza gli effect.
  constructor() {
    // Ferma l'animazione quando arrivano i dati reali.
    effect(() => {
      if (this.isGlobalLoading()) return;
      clearInterval(this.intervalId);
      this.randomNumber.set(0);
    });
  }

  // Avvia il timer iniziale.
  ngOnInit() {
    this.simulateLoading();
  }

  // Libera il timer attivo.
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Simula il totale in loading.
  simulateLoading() {
    this.intervalId = setInterval(() => {
      this.randomNumber.set(Math.random() * (100000 - 10000) + 10000);
    }, 70);
  }

  // Filtri della tabella.
  selectedAssetType = signal<AssetType | null>(null);
  selectedProvider = signal<string | null>(null);

  readonly assetTypeOptions = ASSET_TYPE_FILTER_OPTIONS;

  readonly isCreateDialogOpen = signal(false);
  readonly isAssetDetailsDialogOpen = signal(false);
  readonly isManageAccountsDialogOpen = signal(false);
  readonly createAssetMode = signal<AssetCreateMode>('financial');
  readonly selectedAsset = signal<Asset | null>(null);
  readonly selectedAssetForDetails = signal<Asset | null>(null);
  readonly selectedAssetForAccounts = signal<Asset | null>(null);

  // Asset uniti tra intangibili e fisici.
  allAssets = computed<AssetTableRow[]>(() => {
    const intangible = this.assetStore.intangibleAssets()?.assets ?? [];
    const physical = this.assetStore.physicalAssets()?.assets ?? [];
    const variationLookup = new Map(
      this.assetStore
        .monthlyVariations()
        .map((variation) => [
          variation.assetUuid,
          [...variation.monthlyVariations].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          ),
        ]),
    );
    return [...intangible, ...physical].map((asset) => {
      const monthlyVariations = variationLookup.get(asset.uuid) ?? [];
      const providerNames = [...new Set(asset.positions.map((position) => position.accountName))];
      const provider =
        providerNames.length === 0
          ? 'Nessun conto'
          : providerNames.length === 1
            ? providerNames[0]
            : `${providerNames[0]} +${providerNames.length - 1}`;

      return {
        ...asset,
        provider,
        providerNames,
        performance: this.derivePerformancePercent(asset),
        monthlyVariations,
      };
    });
  });

  //TODO: capire come gestire questa cosa, di deafult prima era EUR, da vedere a BE se fa sempre la conversione
  readonly portfolioValuationCurrency = computed(() => {
    const currencies = [...new Set(this.allAssets().map((asset) => asset.valuationCurrency))];
    return currencies.length === 1 ? currencies[0] : Currency.EUR;
  });

  // Opzioni provider generate dalla lista attuale.
  readonly providerOptions = computed(() => {
    const providers = [
      ...new Set(
        this.allAssets()
          .flatMap((asset) => asset.providerNames)
          .filter(Boolean),
      ),
    ];
    return [
      { label: 'TUTTI I PROVIDER', value: null },
      ...providers.map((provider) => ({ label: provider, value: provider })),
    ];
  });

  // Asset dopo l'applicazione dei filtri.
  filteredAssets = computed(() => {
    const assetType = this.selectedAssetType();
    const provider = this.selectedProvider();

    return this.allAssets().filter((asset) => {
      const matchesType = assetType === null || asset.type === assetType;
      const matchesProvider = provider === null || asset.providerNames.includes(provider);
      return matchesType && matchesProvider;
    });
  });

  // Valore totale mostrato nell'header.
  totalAssetsValue = computed(() => {
    if (this.isGlobalLoading()) return this.randomNumber();
    const intangibleHeight = this.assetStore.intangibleAssets()?.netTotal ?? 0;
    const physicalHeight = this.assetStore.physicalAssets()?.netTotal ?? 0;
    return intangibleHeight + physicalHeight;
  });

  // Totali mensili aggregati su tutti gli asset mostrati nel box totale.
  allAssetsMonthlyNetWorth = computed<MonthlyNetWorth[]>(() => {
    return this.buildMonthlyNetWorth(this.allAssets());
  });

  // Variazione reale del totale assets rispetto al mese precedente.
  growthAssets = computed(() => {
    const monthlyNetWorth = this.allAssetsMonthlyNetWorth();

    if (monthlyNetWorth.length < 2) {
      return 0;
    }

    const currentMonthValue = monthlyNetWorth[monthlyNetWorth.length - 1]?.value ?? 0;
    const previousMonthValue = monthlyNetWorth[monthlyNetWorth.length - 2]?.value ?? 0;

    if (previousMonthValue <= 0) {
      return 0;
    }

    return ((currentMonthValue - previousMonthValue) / previousMonthValue) * 100;
  });

  // Ultimo aggiornamento tra i due gruppi.
  lastUpdate = computed(() => {
    const d1 = this.assetStore.intangibleAssets()?.lastUpdate;
    const d2 = this.assetStore.physicalAssets()?.lastUpdate;
    const dates = [d1, d2].filter(Boolean) as Date[];
    if (dates.length === 0) return undefined;
    return new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
  });

  // Top asset più bucket "altri" per la torta.
  assetDistribution = computed<ChartSlice[]>(() => {
    const rankedAssets = [...this.filteredAssets()].sort((a, b) => b.totalValue - a.totalValue);
    const topAssets = rankedAssets.slice(0, 5).map((asset) => ({
      label: asset.name,
      value: asset.totalValue,
    }));

    const othersValue = rankedAssets.slice(5).reduce((sum, asset) => sum + asset.totalValue, 0);

    if (othersValue > 0) {
      topAssets.push({
        label: 'Altri asset',
        value: othersValue,
      });
    }

    return topAssets;
  });

  // Etichette e valori passati alla torta.
  assetChartLabels = computed(() => this.assetDistribution().map((slice) => slice.label));
  assetChartValues = computed(() => this.assetDistribution().map((slice) => slice.value));

  // Totali mensili aggregati sugli asset filtrati.
  filteredAssetsMonthlyNetWorth = computed<MonthlyNetWorth[]>(() => {
    return this.buildMonthlyNetWorth(this.filteredAssets());
  });

  // Calcola la performance stimata.
  private derivePerformancePercent(asset: Asset): number {
    const costBasis = asset.totalValue - asset.unrealizedGain;

    if (!costBasis || costBasis <= 0) {
      return 0;
    }

    const performance = (asset.unrealizedGain / costBasis) * 100;
    return Number(performance.toFixed(2));
  }

  // Aggrega la serie mensile usando solo i mesi realmente restituiti dal backend.
  private buildMonthlyNetWorth(assets: AssetTableRow[]): MonthlyNetWorth[] {
    const monthlyTotals = new Map<number, number>();

    for (const asset of assets) {
      for (const point of asset.monthlyVariations) {
        const date = new Date(point.date);
        const key = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
        monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + point.value);
      }
    }

    return [...monthlyTotals.entries()]
      .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
      .map(([monthTimestamp, value]) => ({
        date: new Date(monthTimestamp),
        value,
      }));
  }

  // Restituisce la label tipo.
  getAssetTypeLabel(type: AssetType): string {
    return ASSET_TYPE_LABELS[type] ?? type;
  }

  // Apre il dialog creazione.
  openCreateDialog(mode: AssetCreateMode): void {
    this.selectedAsset.set(null);
    this.createAssetMode.set(mode);
    this.isCreateDialogOpen.set(true);
  }

  // Apre il dialog modifica.
  openEditDialog(asset: Asset): void {
    this.selectedAsset.set(asset);
    this.createAssetMode.set(isPhysicalAssetType(asset.type) ? 'physical' : 'financial');
    this.isCreateDialogOpen.set(true);
  }

  // Apre il dialog dettagli.
  openAssetDetailsDialog(asset: Asset): void {
    this.selectedAssetForDetails.set(asset);
    this.isAssetDetailsDialogOpen.set(true);
  }

  // Apre il dialog conti separato dal riepilogo dettagli.
  openManageAccountsDialog(asset: Asset): void {
    this.selectedAssetForAccounts.set(asset);
    this.isManageAccountsDialogOpen.set(true);
  }

  // Sincronizza il dialog asset.
  onDialogVisibilityChange(visible: boolean): void {
    this.isCreateDialogOpen.set(visible);

    if (!visible) {
      this.selectedAsset.set(null);
    }
  }

  // Sincronizza il dialog dettagli.
  onAssetDetailsDialogVisibilityChange(visible: boolean): void {
    this.isAssetDetailsDialogOpen.set(visible);

    if (!visible) {
      this.selectedAssetForDetails.set(null);
    }
  }

  // Sincronizza il dialog conti dedicato.
  onManageAccountsDialogVisibilityChange(visible: boolean): void {
    this.isManageAccountsDialogOpen.set(visible);

    if (!visible) {
      this.selectedAssetForAccounts.set(null);
    }
  }

  // Passa dai dettagli al dialog modifica senza lasciare overlay aperti.
  onAssetEditRequested(asset: Asset): void {
    this.onAssetDetailsDialogVisibilityChange(false);
    this.openEditDialog(asset);
  }

  // Pulisce la selezione e riallinea i grafici dopo che lo store ha gia ricevuto l'asset dal backend.
  onAssetSaved(): void {
    this.selectedAsset.set(null);
    this.assetStore.reloadMonthlyVariations();
  }

  // Ricarica solo le serie mensili, lasciando invariata la lista gia aggiornata localmente.
  onAssetAccountsChanged(): void {
    this.assetStore.reloadMonthlyVariations();
  }

  // Riallinea i grafici quando un asset viene eliminato dal dialog dettagli.
  onAssetDeleted(): void {
    this.onAssetDetailsDialogVisibilityChange(false);
    this.assetStore.reloadMonthlyVariations();
  }
}
