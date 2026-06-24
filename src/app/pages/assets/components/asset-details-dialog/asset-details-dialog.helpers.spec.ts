import { Asset, AssetType, Currency, MetalType } from '../../../../models/asset.model';
import { buildAssetDetailCards } from './asset-details-dialog.helpers';

// Crea un asset di base per testare il mapping delle card dettagli.
function createAssetFixture(overrides: Partial<Asset> = {}): Asset {
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
    quantity: 2,
    currentPrice: 100,
    totalValue: 200,
    valuationCurrency: Currency.EUR,
    positions: [],
    lastMarketUpdate: null,
    averageBuyPrice: 90,
    taxRate: 26,
    netValue: 180,
    unrealizedGain: 20,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('buildAssetDetailCards', () => {
  it('should include ticker and price cards for financial assets', () => {
    const cards = buildAssetDetailCards(createAssetFixture(), 12.5);

    expect(cards.some((card) => card.id === 'ticker')).toBeTrue();
    expect(cards.some((card) => card.id === 'average-buy-price')).toBeTrue();
    expect(cards.some((card) => card.id === 'current-price')).toBeTrue();
  });

  it('should include precious metal specific cards and exclude ticker', () => {
    const cards = buildAssetDetailCards(
      createAssetFixture({
        type: AssetType.PRECIOUS_METAL,
        ticker: null,
        metalType: MetalType.GOLD,
        purity: 0.999,
        weightGrams: 31.1,
      }),
      8.4,
    );

    expect(cards.some((card) => card.id === 'metal-type')).toBeTrue();
    expect(cards.some((card) => card.id === 'purity')).toBeTrue();
    expect(cards.some((card) => card.id === 'total-weight')).toBeTrue();
    expect(cards.some((card) => card.id === 'ticker')).toBeFalse();
  });
});
