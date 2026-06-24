export interface ApiErrorPayload {
  code: string;
  detail: string;
}

export interface ApiErrorToastPayload {
  code: string | null;
  detail: string;
  status: number;
  url: string | null;
}
