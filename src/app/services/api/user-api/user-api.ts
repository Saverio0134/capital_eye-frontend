import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient, httpResource } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserApi {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/user`;
  public readonly getUserUrl = this.apiUrl;


  getUser() {
    return this.http.get(this.apiUrl);
  }

  setName(name: string) {
    return this.http.post(`${this.apiUrl}/set-name/${name}`, null);
  }
}
