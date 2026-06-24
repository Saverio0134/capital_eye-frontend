import { TestBed } from '@angular/core/testing';

import { SnapshotStore } from './snapshot-store';

describe('SnapshotStore', () => {
  let service: SnapshotStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnapshotStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
