import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AssetApi } from './asset-api';


describe('AssetApi', () => {
  let service: AssetApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(AssetApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build the monthly variations endpoint with the default limit', () => {
    expect(service.getMonthlyVariations()).toBe(`${environment.apiUrl}/assets/monthly-variations`);
  });

  it('should build the delete position endpoint', () => {
    expect(service.deleteAssetPositionByUuid('asset-1', 'position-1')).toBe(
      `${environment.apiUrl}/assets/asset-1/positions/position-1`,
    );
  });
});
