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

  it('should include total buy price card calculated from totalValue and unrealizedGain', () => {
    const asset = createAssetFixture({
      totalValue: 200,
      unrealizedGain: 20,
    });
    const cards = buildAssetDetailCards(asset, 11.11);
    const totalBuyPriceCard = cards.find((card) => card.id === 'total-buy-price');

    expect(totalBuyPriceCard).toBeDefined();
    expect(totalBuyPriceCard?.label).toBe('Prezzo Totale Acquisto');
    expect(totalBuyPriceCard?.kind).toBe('currency');
    expect(totalBuyPriceCard?.value).toBe(180);
  });

  it('should include both gross gain and net gain cards', () => {
    const asset = createAssetFixture({
      totalValue: 200,
      unrealizedGain: 20,
      netValue: 194.8,
    });
    const cards = buildAssetDetailCards(asset, 11.11);

    const grossGainCard = cards.find((card) => card.id === 'gross-gain');
    expect(grossGainCard).toBeDefined();
    expect(grossGainCard?.label).toBe('Guadagno Lordo');
    expect(grossGainCard?.kind).toBe('currency');
    expect(grossGainCard?.value).toBe(20);
    expect(grossGainCard?.tone).toBe('positive');

    const netGainCard = cards.find((card) => card.id === 'net-gain');
    expect(netGainCard).toBeDefined();
    expect(netGainCard?.label).toBe('Guadagno Netto');
    expect(netGainCard?.kind).toBe('currency');
    expect(netGainCard?.value).toBe(14.8);
    expect(netGainCard?.tone).toBe('positive');
  });

  it('should handle negative tones for both gross gain and net gain when asset is in loss', () => {
    const asset = createAssetFixture({
      totalValue: 100,
      unrealizedGain: -50,
      netValue: 100,
    });
    const cards = buildAssetDetailCards(asset, -33.33);

    const grossGainCard = cards.find((card) => card.id === 'gross-gain');
    expect(grossGainCard?.value).toBe(-50);
    expect(grossGainCard?.tone).toBe('negative');

    const netGainCard = cards.find((card) => card.id === 'net-gain');
    expect(netGainCard?.value).toBe(-50);
    expect(netGainCard?.tone).toBe('negative');
  });
});
