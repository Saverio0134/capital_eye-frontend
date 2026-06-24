import { TestBed } from '@angular/core/testing';

import { LiquiditySnapshotApi } from './liquidity-snapshot-api';

describe('LiquiditySnapshotApi', () => {
  let service: LiquiditySnapshotApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiquiditySnapshotApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
