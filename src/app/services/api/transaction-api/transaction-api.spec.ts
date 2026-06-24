import { TestBed } from '@angular/core/testing';

import { TransactionApi } from './transaction-api';

describe('TransactionApi', () => {
  let service: TransactionApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
