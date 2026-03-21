import { environment } from '../../environments/environment';

type RuntimeConfig = {
  apiUrl?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

export function getApiBaseUrl(): string {
  const runtimeApiUrl = window.__APP_CONFIG__?.apiUrl?.trim();
  const fallbackApiUrl = environment.apiUrl?.trim();
  const resolvedApiUrl = runtimeApiUrl || fallbackApiUrl || '';

  return resolvedApiUrl.replace(/\/+$/, '');
}
