import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../services/store/auth-store/auth-store';

import LoggedLayout from './logged-layout';

class AuthStoreStub {
  logout = jasmine.createSpy('logout').and.resolveTo();
}

describe('LoggedLayout', () => {
  let component: LoggedLayout;
  let fixture: ComponentFixture<LoggedLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoggedLayout],
      providers: [provideRouter([]), { provide: AuthStore, useClass: AuthStoreStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoggedLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
