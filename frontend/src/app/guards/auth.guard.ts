import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isLoggedIn$.pipe(
      take(1),
      map((isLoggedIn: boolean) => {
        const requiresAdmin = route.data['requiresAdmin'] || false;
        const requiredActions: string[] = route.data['requiredActions'] || [];

        if (isLoggedIn) {
          if (requiresAdmin && !this.authService.isAdmin()) {
            this.router.navigate(['/']);
            return false;
          }

          const userAction = this.authService.getAction();
          if (requiredActions.length && !requiredActions.includes(userAction || '')) {
            this.router.navigate(['/forbidden']);
            return false;
          }

          return true;
        } else {
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      })
    );
  }
}
