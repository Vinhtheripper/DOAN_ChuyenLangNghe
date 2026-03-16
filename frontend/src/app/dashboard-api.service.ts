import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildUrl } from './utils/url.util';

@Injectable({
  providedIn: 'root'
})
export class DashboardAPIService {
  private baseURL = buildUrl('/dashboard');

  constructor(private http: HttpClient) { }

  // Get dashboard statistics
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseURL}/stats`, { withCredentials: true });
  }

  getRecentActivities(): Observable<any> {
    return this.http.get(`${this.baseURL}/activities`, { withCredentials: true });
  }
}
