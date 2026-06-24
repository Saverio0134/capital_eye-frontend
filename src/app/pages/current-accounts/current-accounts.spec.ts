import { ComponentFixture, TestBed } from '@angular/core/testing';

import CurrentAccounts from './current-accounts';

describe('CurrentAccounts', () => {
  let component: CurrentAccounts;
  let fixture: ComponentFixture<CurrentAccounts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentAccounts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentAccounts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
