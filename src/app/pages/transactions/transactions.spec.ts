import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import Transactions from './transactions';
import { FinancialAccountStore } from '../../services/store/financial-account-store/financial-account-store';
import { AssetStore } from '../../services/store/asset-store/asset-store';
import { LiquidityStore } from '../../services/store/liquidity-store/liquidity-store';
import { LiquiditySnapshotApi } from '../../services/api/liquidity-snapshot-api/liquidity-snapshot-api';
import { TransactionApi } from '../../services/api/transaction-api/transaction-api';
import { TransactionStore } from '../../services/store/transaction-store/transaction-store';
import { Asset, AssetType, Currency } from '../../models/asset.model';
import { Transaction } from '../../models/transaction.model';

// Crea un asset di test conforme al nuovo summary backend.
function createAssetFixture(): Asset {
  return {
    uuid: 'asset-1',
    userId: 'user-1',
    name: 'VWCE',
    type: AssetType.STOCK,
    baseCurrency: Currency.EUR,
    ticker: 'VWCE',
    isCustom: false,
    metalType: null,
    weightGrams: null,
    purity: null,
    quantity: 1,
    currentPrice: 100,
    totalValue: 100,
    valuationCurrency: Currency.EUR,
    positions: [
      {
        uuid: 'position-1',
        accountUuid: 'account-1',
        accountName: 'Conto Corrente Principale',
        accountType: 'BANK',
        currency: Currency.EUR,
        quantity: 1,
        currentPrice: 100,
        totalValue: 100,
        averageBuyPrice: 90,
        lastMarketUpdate: null,
      },
    ],
    lastMarketUpdate: null,
    averageBuyPrice: 90,
    taxRate: 26,
    netValue: 100,
    unrealizedGain: 10,
    updatedAt: new Date(),
  };
}

describe('Transactions', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;
  let assetTransactionsSignal: ReturnType<typeof signal<Transaction[]>>;
  let financialAccountsSignal: ReturnType<
    typeof signal<
      Array<{ uuid: string; name: string; type: 'BANK'; currency: Currency }>
    >
  >;
  let assetStoreStub: {
    intangibleAssets: () => {
      assets: Asset[];
      netTotal: number;
      growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
      lastUpdate: Date;
    };
    physicalAssets: () => {
      assets: Asset[];
      netTotal: number;
      growth: { oneMonth: number; threeMonths: number; sixMonths: number; year: number };
      lastUpdate: Date;
    };
    assetsResource: () => { isLoading: () => boolean };
    reloadAssets: jasmine.Spy;
  };
  let transactionStoreStub: {
    assetTransactions: () => Transaction[];
    assetTransactionsResource: () => { isLoading: () => boolean };
    reloadTransactions: jasmine.Spy;
  };

  beforeEach(async () => {
    assetTransactionsSignal = signal<Transaction[]>([]);
    financialAccountsSignal = signal([
      {
        uuid: 'account-1',
        name: 'Conto Corrente Principale',
        type: 'BANK' as const,
        currency: Currency.EUR,
      },
    ]);
    assetStoreStub = {
      intangibleAssets: () => ({
        assets: [createAssetFixture()],
        netTotal: 100,
        growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
        lastUpdate: new Date(),
      }),
      physicalAssets: () => ({
        assets: [],
        netTotal: 0,
        growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
        lastUpdate: new Date(),
      }),
      assetsResource: () => ({
        isLoading: () => false,
      }),
      reloadAssets: jasmine.createSpy('reloadAssets'),
    };
    transactionStoreStub = {
      assetTransactions: () => assetTransactionsSignal(),
      assetTransactionsResource: () => ({
        isLoading: () => false,
      }),
      reloadTransactions: jasmine.createSpy('reloadTransactions'),
    };

    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [
        {
          provide: FinancialAccountStore,
          useValue: {
            financialAccounts: () => financialAccountsSignal(),
            financialAccountsResource: () => ({
              isLoading: () => false,
            }),
          },
        },
        {
          provide: AssetStore,
          useValue: assetStoreStub,
        },
        {
          provide: LiquidityStore,
          useValue: {
            allSnapshots: () => [],
            allSnapshotsResource: () => ({
              isLoading: () => false,
            }),
            reloadLiquidityData: jasmine.createSpy('reloadLiquidityData'),
          },
        },
        {
          provide: LiquiditySnapshotApi,
          useValue: {
            createSnapshot: () => of({}),
            deleteSnapshot: () => of(void 0),
          },
        },
        {
          provide: TransactionApi,
          useValue: {
            createTransaction: () => of({}),
          },
        },
        {
          provide: TransactionStore,
          useValue: transactionStoreStub,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the empty state message when there are no entries', () => {
    expect(fixture.nativeElement.textContent).toContain('Nessuna registrazione trovata');
  });

  it('should render asset transactions from the transaction store', () => {
    assetTransactionsSignal.set([
      {
        uuid: 'transaction-1',
        assetUuid: 'asset-1',
        accountUuid: 'account-1',
        type: 'BUY',
        date: new Date('2026-05-10T12:00:00.000Z'),
        quantity: 2,
        totalAmount: 240,
        fees: null,
        notes: null,
        realizedGain: null,
        taxAmount: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
    ]);

    component.setActiveTab('assets');
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));

    expect(rows.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('ACQUISTO');
    expect(fixture.nativeElement.textContent).toContain('VWCE');
  });

  it('should use the linked account currency for asset transaction rows', () => {
    financialAccountsSignal.set([
      {
        uuid: 'account-2',
        name: 'Broker USD',
        type: 'BANK',
        currency: Currency.USD,
      },
    ]);
    assetStoreStub.intangibleAssets = () => ({
      assets: [
        {
          ...createAssetFixture(),
          valuationCurrency: Currency.USD,
          positions: [
            {
              uuid: 'position-2',
              accountUuid: 'account-2',
              accountName: 'Broker USD',
              accountType: 'BANK',
              currency: Currency.USD,
              quantity: 1,
              currentPrice: 100,
              totalValue: 100,
              averageBuyPrice: 90,
              lastMarketUpdate: null,
            },
          ],
        },
      ],
      netTotal: 100,
      growth: { oneMonth: 0, threeMonths: 0, sixMonths: 0, year: 0 },
      lastUpdate: new Date(),
    });
    assetTransactionsSignal.set([
      {
        uuid: 'transaction-2',
        assetUuid: 'asset-1',
        accountUuid: 'account-2',
        type: 'BUY',
        date: new Date('2026-05-10T12:00:00.000Z'),
        quantity: 1,
        totalAmount: 100,
        fees: null,
        notes: null,
        realizedGain: null,
        taxAmount: null,
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
    ]);

    component.setActiveTab('assets');
    fixture.detectChanges();

    expect(component.tableRows()[0]?.currency).toBe(Currency.USD);
  });
});
