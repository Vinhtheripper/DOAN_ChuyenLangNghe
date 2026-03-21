import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartItem } from '../interface/Cart';

@Injectable({
  providedIn: 'root'
})
export class CartAPIService {
  private apiUrl = '/cart';
  private token: string | null = null;

  constructor(private http: HttpClient) { }

  setToken(token: string, rememberMe: boolean = false): void {
    this.token = token;
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return this.token;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => new Error(error.message || 'Server error occurred'));
  }

  getCartItems(): Observable<CartItem[]> {
    return this.http
      .get<CartItem[]>(`${this.apiUrl}`, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  addToCart(productId: string, quantity: number, unit_price: number): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/add`, { productId, quantity, unit_price }, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  removeFromCart(productId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/remove/${productId}`, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  removeOrderedItems(orderedItemIds: string[]): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/removeOrderedItems`, { orderedItemIds }, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  updateQuantity(productId: string, quantity: number): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.apiUrl}/update`, { productId, quantity }, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  clearCart(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/clear`, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  saveSelectedItems(selectedItems: CartItem[]): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/saveSelectedItems`, { selectedItems }, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }
}
