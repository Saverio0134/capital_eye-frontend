import { TestBed } from '@angular/core/testing';

import { FinancialAccountApi } from './financial-account-api';

describe('FinancialAccountApi', () => {
  let service: FinancialAccountApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinancialAccountApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
