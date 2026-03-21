import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FeedbackAPIService {
  private apiUrl = '/feedback';
  private token: string | null = null;

  constructor(private http: HttpClient) { }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    if (error.status === 0) {
      errorMessage = 'Network error occurred. Please check your connection.';
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid feedback data provided.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in and try again.';
          break;
        case 500:
          errorMessage = 'An internal server error occurred. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || 'An unexpected error occurred. Please try again later.';
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  submitFeedback(feedbackData: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    message: string;
  }): Observable<{ feedbackId: string; message: string }> {
    return this.http
      .post<{ feedbackId: string; message: string }>(this.apiUrl, feedbackData, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }
}
