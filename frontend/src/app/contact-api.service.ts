import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from '../interface/Contact';

@Injectable({
  providedIn: 'root'
})
export class ContactAPIService {
  private baseURL = '/feedback';

  constructor(private http: HttpClient) { }

  // Get all contacts/feedback for admin
  getContacts(page: number = 1, limit: number = 10, search: string = '', status: string = ''): Observable<any> {
    let url = `${this.baseURL}?page=${page}&limit=${limit}`;
    if (search) url += `&search=${search}`;
    if (status) url += `&status=${status}`;
    return this.http.get(url, { withCredentials: true });
  }

  // Update contact status
  updateStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseURL}/${id}/status`, { status }, { withCredentials: true });
  }

  // Delete contact
  deleteContact(id: string): Observable<any> {
    return this.http.delete(`${this.baseURL}/${id}`, { withCredentials: true });
  }

  // Submit contact (public)
  submitContact(contact: Contact): Observable<any> {
    return this.http.post(this.baseURL, contact);
  }
}
