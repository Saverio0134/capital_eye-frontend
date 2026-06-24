import { ComponentFixture, TestBed } from '@angular/core/testing';
import { submit } from '@angular/forms/signals';
import { provideRouter } from '@angular/router';

import { AuthForm } from '../../../../services/api/firebase-api/firebase-api';
import { AuthStore } from '../../../../services/store/auth-store/auth-store';
import Registration from './registration';

describe('Registration', () => {
  let component: Registration;
  let fixture: ComponentFixture<Registration>;
  let authStore: Pick<AuthStore, 'register' | 'loginFirebaseWithProvider'>;

  beforeEach(async () => {
    authStore = {
      register: jasmine.createSpy('register').and.resolveTo(),
      loginFirebaseWithProvider: jasmine.createSpy('loginFirebaseWithProvider').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: authStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registration);
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
    component.registrationFormModel.set(credentials);

    const success = await submit(component.registrationForm);

    expect(success).toBeTrue();
    expect(authStore.register).toHaveBeenCalledOnceWith(credentials);
  });
});
