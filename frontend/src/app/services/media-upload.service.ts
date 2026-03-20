import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { buildUrl } from '../utils/url.util';

export type MediaUploadScope = 'products' | 'blogs' | 'avatars' | 'reviews';

@Injectable({
  providedIn: 'root'
})
export class MediaUploadService {
  private readonly uploadUrl = buildUrl('/uploads/image');

  constructor(private http: HttpClient) {}

  uploadImage(file: File, scope: MediaUploadScope): Observable<{ url: string; handle: string; filename: string; size: number; mimetype: string }> {
    return this.http.post<{ url: string; handle: string; filename: string; size: number; mimetype: string }>(
      `${this.uploadUrl}?scope=${scope}`,
      file,
      {
        headers: new HttpHeaders({
          'Content-Type': file.type,
          'X-Upload-Filename': file.name
        }),
        withCredentials: true
      }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Image upload failed.';
        return throwError(() => new Error(message));
      })
    );
  }
}
