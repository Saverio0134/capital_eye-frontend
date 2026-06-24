import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LiquidityMonthlyTable } from '../../../models/liquidity.model';
import {
  CreateLiquiditySnapshotPayload,
  LiquiditySnapshotWithAccount,
} from '../../../models/transaction.model';
@Injectable({
  providedIn: 'root',
})
export class LiquiditySnapshotApi {
  readonly base = `${environment.apiUrl}/liquidity-snapshots`;
  readonly totalLatestLiquidity = `${this.base}/total-amount-latest`;
  readonly snapshotsByAccount = (accountUuid: string) => `${this.base}/${accountUuid}`;
  readonly monthlyTable = `${this.base}/monthly-table`;
  constructor(private http: HttpClient) {}

  fetchAllSnapshots(): Observable<LiquiditySnapshotWithAccount[]> {
    return this.http.get<LiquiditySnapshotWithAccount[]>(this.base);
  }

  createSnapshot(snapshotData: CreateLiquiditySnapshotPayload): Observable<LiquiditySnapshotWithAccount> {
    return this.http.post<LiquiditySnapshotWithAccount>(this.base, snapshotData);
  }

  deleteSnapshot(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${uuid}`);
  }
}
