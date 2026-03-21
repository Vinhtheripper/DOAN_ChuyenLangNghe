import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isApiRequest } from '../config/api-routes.config';
import { getApiBaseUrl } from '../config/runtime-config';

@Injectable()
export class ApiBaseUrlInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (/^https?:\/\//i.test(req.url) || !isApiRequest(req.url)) {
      return next.handle(req);
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return next.handle(req);
    }

    const normalizedUrl = `${apiBaseUrl}${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
    return next.handle(req.clone({ url: normalizedUrl }));
  }
}
