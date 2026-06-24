import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { provideRouter } from '@angular/router';

import { AuthForm } from '../../../../services/api/firebase-api/firebase-api';
import { AuthStore } from '../../../../services/store/auth-store/auth-store';
import Login from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authStore: Pick<AuthStore, 'loginFirebaseWithCredential' | 'loginFirebaseWithProvider'>;

  beforeEach(async () => {
    authStore = {
      loginFirebaseWithCredential: jasmine
        .createSpy('loginFirebaseWithCredential')
        .and.resolveTo(),
      loginFirebaseWithProvider: jasmine.createSpy('loginFirebaseWithProvider').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: authStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit credentials through the signal form action', async () => {
    const credentials: AuthForm = {
      email: 'user@example.com',
      password: 'password',
    };
    component.loginFormModel.set(credentials);

    const success = await submit(component.loginForm);

    expect(success).toBeTrue();
    expect(authStore.loginFirebaseWithCredential).toHaveBeenCalledOnceWith(credentials);
  });
});
