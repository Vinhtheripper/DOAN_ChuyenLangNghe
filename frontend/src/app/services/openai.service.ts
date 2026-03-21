import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OpenAiService {
  constructor() { }

  sendMessage(messages: { role: string; content: string }[]): Observable<any> {
    return throwError(
      () => new Error('Client-side OpenAI access is disabled. Route AI requests through a backend endpoint instead.')
    );
  }
}
