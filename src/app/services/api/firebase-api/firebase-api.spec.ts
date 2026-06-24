import { TestBed } from '@angular/core/testing';

import { FirebaseApi } from './firebase-api';

describe('FirebaseApi', () => {
  let service: FirebaseApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
