import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardAPIService {
  private baseURL = '/dashboard';

  constructor(private http: HttpClient) { }

  // Get dashboard statistics
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseURL}/stats`, { withCredentials: true });
  }

  getRecentActivities(): Observable<any> {
    return this.http.get(`${this.baseURL}/activities`, { withCredentials: true });
  }
}
