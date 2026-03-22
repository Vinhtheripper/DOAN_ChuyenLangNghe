import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources?: {
    products?: string[];
    blogs?: string[];
    coupons?: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class OpenAiService {
  constructor(private readonly http: HttpClient) {}

  sendMessage(messages: ChatMessagePayload[]): Observable<ChatResponse> {
    const history = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1];

    return this.http.post<ChatResponse>('/ai/chat', {
      message: latestMessage?.content ?? '',
      history
    });
  }
}
