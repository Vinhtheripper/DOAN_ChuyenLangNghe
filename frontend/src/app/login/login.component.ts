import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAPIService } from '../user-api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginError: string | null = null;
  showPassword: boolean = false;

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
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;

      this.userAPIService.loginUser({ email, password, rememberMe }).subscribe({
        next: (response) => {
          const { userId, role, token, action } = response;
          this.authService.login(email, password, rememberMe, userId, role, token, action);
          this.router.navigate(['/']);
        },
        error: () => {
          this.loginError = 'Email hoặc mật khẩu không chính xác';
        }
      });
    }
  }
}
