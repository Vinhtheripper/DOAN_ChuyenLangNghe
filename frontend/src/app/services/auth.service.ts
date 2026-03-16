import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { UserAPIService } from '../user-api.service';
import { map, tap, catchError } from 'rxjs/operators';
import { CartService } from './cart.service';
import { CartAPIService } from '../cart-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$: Observable<boolean> = this.loggedIn.asObservable();
  private logoutEvent = new Subject<void>();
  logoutEvent$ = this.logoutEvent.asObservable();
  private cartService: CartService | null = null;

  constructor(
    private userAPIService: UserAPIService,
    private injector: Injector,
    private cartAPIService: CartAPIService
  ) {
    this.initializeLoginStatus();
  }

  private getCartService(): CartService {
    if (!this.cartService) {
      this.cartService = this.injector.get(CartService);
    }
    return this.cartService;
  }

  private initializeLoginStatus(): void {
    const token = this.getToken();
    if (token) {
      this.loggedIn.next(true);
      this.cartAPIService.setToken(token);
    } else {
      console.warn('No token found during initialization.');
    }
  }

  private storeSessionData(userId: string, role: string, rememberMe: boolean, token: string, action?: string): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('isLoggedIn', 'true');
    storage.setItem('userId', userId);
    storage.setItem('role', role);
    storage.setItem('token', token);
    if (action) {
      storage.setItem('action', action);
    }
  }

  private clearSessionData(): void {
    ['isLoggedIn', 'userId', 'role', 'token', 'action'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  getAction(): string | null {
    return localStorage.getItem('action') || sessionStorage.getItem('action') || 'just view';
  }

  login(email: string, password: string, rememberMe: boolean, userId?: string, role?: string, token?: string, action?: string): void {
    if (userId && role && token) {
      this.storeSessionData(userId, role, rememberMe, token, action);
      this.loggedIn.next(true);
      this.cartAPIService.setToken(token, rememberMe);
    } else {
      this.userAPIService.loginUser({ email, password, rememberMe }).pipe(
        tap(response => {
          const { userId, role, token, action } = response;
          this.storeSessionData(userId, role, rememberMe, token, action);
          this.loggedIn.next(true);
          this.cartAPIService.setToken(token, rememberMe);
        }),
        catchError((error) => {
          this.loggedIn.next(false);
          return throwError(() => new Error('Login failed'));
        })
      ).subscribe();
    }
  }

  logout(): void {
    this.userAPIService.logoutUser().pipe(
      tap(() => {
        this.clearSessionData();
        this.getCartService().clearCart();
        this.loggedIn.next(false);
        this.cartAPIService.setToken('');
        this.logoutEvent.next();
      }),
      catchError((error) => {
        return throwError(() => new Error('Logout failed'));
      })
    ).subscribe();
  }

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  isAdmin(): boolean {
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');
    const action = localStorage.getItem('action') || sessionStorage.getItem('action') || 'just view';
    const validActions = ['edit all', 'just view', 'sales ctrl', 'account ctrl'];

    return role === 'admin' && validActions.includes(action || '');
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
  }

  getLikedProducts(): string[] {
    const userId = this.getUserId();
    if (!userId) return [];
    const likedProducts = localStorage.getItem(`likedProducts_${userId}`);
    return likedProducts ? JSON.parse(likedProducts) : [];
  }

  saveLikedProducts(likedProducts: string[]): void {
    const userId = this.getUserId();
    if (!userId) return;
    localStorage.setItem(`likedProducts_${userId}`, JSON.stringify(likedProducts));
  }

  getUserEmail(): Observable<string | null> {
    return this.userAPIService.getUserDetails().pipe(
      map(profile => profile?.email ?? null)
    );
  }
}
