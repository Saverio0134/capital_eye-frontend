import { ComponentFixture, TestBed } from '@angular/core/testing';

import ExternalProviders from './external-providers';

describe('ExternalProviders', () => {
  let component: ExternalProviders;
  let fixture: ComponentFixture<ExternalProviders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalProviders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
