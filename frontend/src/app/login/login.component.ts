import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAPIService } from '../user-api.service';
import { AuthService } from '../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginError: string | null = null;
  showPassword: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userAPIService: UserAPIService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/']);
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;
      this.loginError = null;
      this.isSubmitting = true;

      this.userAPIService.loginUser({ email, password, rememberMe }).pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      ).subscribe({
        next: (response) => {
          const { userId, role, token, action } = response;
          this.authService.login(email, password, rememberMe, userId, role, token, action);
          this.router.navigate(['/']);
        },
        error: () => {
          this.loginError = 'Email hoặc mật khẩu không chính xác';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
