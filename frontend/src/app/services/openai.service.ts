import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OpenAiService {
  private apiUrl = environment.openAi.apiUrl;
  private apiKey = environment.openAi.apiKey;

  constructor(private http: HttpClient) { }

  sendMessage(messages: { role: string; content: string }[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    });

    const body = {
      model: environment.openAi.model,
      messages,
    };

    return this.http.post(this.apiUrl, body, { headers }).pipe(
      catchError((error) => {
        switch (error.status) {
          case 429:
            return throwError(() => new Error('Too many requests. Please wait and try again.'));
          case 401:
            return throwError(() => new Error('Unauthorized. Invalid API Key.'));
          case 500:
            return throwError(() => new Error('Internal server error. Please try again later.'));
          default:
            return throwError(() => new Error(error.message || 'An unexpected error occurred.'));
        }
      })
    );
  }
}
