import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../interface/User';

@Injectable({
    providedIn: 'root'
})
export class SignupService {
    private signupUrl = '/user/signup';

    constructor(private http: HttpClient) { }

    registerUser(userData: User): Observable<any> {
        return this.http.post<any>(this.signupUrl, userData);
    }
}
