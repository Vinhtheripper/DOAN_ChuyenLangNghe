import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../interface/User';

@Injectable({
  providedIn: 'root'
})
export class UserAPIService {
  private apiUrl = '/user';
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
    return throwError(() => new Error(error.message || 'Server error'));
  }

  registerUser(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, user, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  loginUser(credentials: { email: string; password: string; rememberMe?: boolean }): Observable<{ userId: string; role: string; token: string; action: string; message: string }> {
    return this.http.post<{ userId: string; role: string; token: string; action: string; message: string }>(
      `${this.apiUrl}/login`,
      credentials,
      {
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      tap(response => {
        this.setToken(response.token, credentials.rememberMe || false);
      }),
      catchError(this.handleError)
    );
  }

  logoutUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/logout`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getUserDetails(): Observable<Partial<User>> {
    return this.http.get<Partial<User>>(`${this.apiUrl}/profile`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  getUsers(page: number = 1, limit: number = 10, search: string = ''): Observable<{ users: User[]; total: number; pages: number }> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (search) {
      params.search = search;
    }

    return this.http.get<{ users: User[]; total: number; pages: number }>(`${this.apiUrl}/user-management`, {
      headers: this.getHeaders(),
      params,
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  updateUserProfile(userId: string, userData: Partial<User>): Observable<any> {
    if ('_id' in userData) delete userData._id;
    if ('email' in userData) delete userData.email;
    if ('password' in userData) delete userData.password;

    return this.http.patch<any>(`${this.apiUrl}/update/${userId}`, userData, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update current authenticated user's own profile
  updateMyProfile(userData: Partial<User>): Observable<any> {
    const payload = { ...userData } as any;
    delete payload._id;
    delete payload.email;
    delete payload.password;
    return this.http.patch<any>(`${this.apiUrl}/profile`, payload, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  deleteUserAccount(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${userId}`, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }
}
