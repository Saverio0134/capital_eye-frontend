import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Asset,
  CreateAssetPayload,
  MonthlyAssetVariation,
  UpdateAssetPayload,
} from '../../../models/asset.model';
import { normalizeAsset, normalizeMonthlyAssetVariations } from './asset-api.utils';

@Injectable({
  providedIn: 'root',
})
export class AssetApi {
  readonly base = `${environment.apiUrl}/assets`;
  readonly getAllAssets = this.base;
  readonly getAssetByUuid = (uuid: string) => `${this.base}/${uuid}`;
  readonly deleteAssetPositionByUuid = (assetUuid: string, positionUuid: string) =>
    `${this.base}/${assetUuid}/positions/${positionUuid}`;
  readonly getMonthlyVariations = (limit?: number) =>
    `${this.base}/monthly-variations${typeof limit === 'number' ? `?limit=${limit}` : ''}`;

  private http = inject(HttpClient);

  createAsset(assetData: CreateAssetPayload): Observable<Asset> {
    return this.http.post<Asset>(this.base, assetData).pipe(map((asset) => normalizeAsset(asset)));
  }

  updateAsset(uuid: string, assetData: UpdateAssetPayload): Observable<Asset> {
    return this.http
      .put<Asset>(`${this.base}/${uuid}`, assetData)
      .pipe(map((asset) => normalizeAsset(asset)));
  }

  deleteAsset(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`);
  }

  deleteAssetPosition(assetUuid: string, positionUuid: string): Observable<void> {
    return this.http.delete<void>(this.deleteAssetPositionByUuid(assetUuid, positionUuid));
  }

  fetchMonthlyVariations(limit?: number): Observable<MonthlyAssetVariation[]> {
    return this.http
      .get<MonthlyAssetVariation[]>(this.getMonthlyVariations(limit))
      .pipe(map((payload) => normalizeMonthlyAssetVariations(payload)));
  }
}
