import { environment } from '../../environments/environment';

export function buildUrl(path: string): string {
  const base = (environment.apiUrl || '').trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

