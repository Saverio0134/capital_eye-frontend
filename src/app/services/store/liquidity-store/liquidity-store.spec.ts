import { TestBed } from '@angular/core/testing';

import { LiquidityStore } from './liquidity-store';

describe('LiquidityStore', () => {
  let service: LiquidityStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiquidityStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
