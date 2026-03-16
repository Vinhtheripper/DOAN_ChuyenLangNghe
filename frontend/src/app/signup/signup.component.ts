import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAPIService } from '../user-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  signupForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  signupError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userAPIService: UserAPIService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      lastName: ['', Validators.required],
      firstName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue],
      role: ['user']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const savedData = sessionStorage.getItem('signupForm');
    if (savedData) {
      try {
        this.signupForm.patchValue(JSON.parse(savedData));
      } catch { }
    }

    this.signupForm.valueChanges.subscribe(value => {
      sessionStorage.setItem('signupForm', JSON.stringify(value));
    });
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('signupForm');
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.signupError = null;
    if (this.signupForm.valid) {
      sessionStorage.removeItem('signupForm');
      const { lastName, firstName, termsAccepted, ...rest } = this.signupForm.value;
      const profileName = `${(lastName || '').trim()} ${(firstName || '').trim()}`.trim() || 'User';
      const payload = {
        ...rest,
        profileName,
        gender: '',
        birthMonth: '',
        birthDay: '',
        birthYear: '',
        marketing: false
      };
      this.userAPIService.registerUser(payload).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.signupError = err?.error?.message === 'Email is already registered.' || err?.status === 409
            ? 'Email này đã được đăng ký.'
            : 'Đăng ký thất bại. Vui lòng thử lại.';
        }
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }
}
