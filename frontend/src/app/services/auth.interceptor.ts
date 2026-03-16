import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly apiBaseUrl = (environment.apiUrl || '').trim().replace(/\/+$/, '');

  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isRelativeApiRequest = req.url.startsWith('/');
    const isAbsoluteApiRequest = this.apiBaseUrl ? req.url.startsWith(this.apiBaseUrl) : false;

    if (token && (isRelativeApiRequest || isAbsoluteApiRequest)) {
      const modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(modifiedReq);
    }

    return next.handle(req);
  }
}
