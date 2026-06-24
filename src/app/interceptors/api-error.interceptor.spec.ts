import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { apiErrorInterceptor } from './api-error.interceptor';
import { ApiErrorToastService } from '../services/api-error-toast/api-error-toast';

describe('apiErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let apiErrorToastService: jasmine.SpyObj<ApiErrorToastService>;

  beforeEach(() => {
    apiErrorToastService = jasmine.createSpyObj<ApiErrorToastService>('ApiErrorToastService', [
      'show',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ApiErrorToastService,
          useValue: apiErrorToastService,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show the backend detail for api errors', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/api/assets/123'));

    const request = httpMock.expectOne('/api/assets/123');
    request.flush(
      {
        code: 'ASSET_NOT_FOUND',
        detail: 'Asset non trovato o non autorizzato.',
      },
      {
        status: 404,
        statusText: 'Not Found',
      },
    );

    await expectAsync(requestPromise).toBeRejected();
    expect(apiErrorToastService.show).toHaveBeenCalledWith({
      code: 'ASSET_NOT_FOUND',
      detail: 'Asset non trovato o non autorizzato.',
      status: 404,
      url: '/api/assets/123',
    });
  });

  it('should ignore errors from non api requests', async () => {
    const requestPromise = firstValueFrom(httpClient.get('https://example.com/ping'));

    const request = httpMock.expectOne('https://example.com/ping');
    request.flush(
      {
        code: 'IGNORED_ERROR',
        detail: 'Questo errore non deve generare toast.',
      },
      {
        status: 500,
        statusText: 'Server Error',
      },
    );

    await expectAsync(requestPromise).toBeRejected();
    expect(apiErrorToastService.show).not.toHaveBeenCalled();
  });
});
