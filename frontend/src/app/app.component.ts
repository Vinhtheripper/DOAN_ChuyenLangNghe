import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'my-app';
  isLoggedIn: boolean = false;
  isAdminRoute: boolean = false;
  isLoginRoute: boolean = false;
  isSignupRoute: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      const wasLoggedOut = !this.isLoggedIn;
      this.isLoggedIn = isLoggedIn;
      
      // Show loading when user just logged in
      if (wasLoggedOut && isLoggedIn) {
        this.loadingService.show();
        
        // Navigate to homepage
        this.router.navigate(['/']).then(() => {
          // Hide loading after 5 seconds
          setTimeout(() => {
            this.loadingService.hide();
          }, 5000); // 5 seconds
        });
      }
    });

    // Handle route detection (no loading for normal navigation)
    const updateRouteFlags = (url: string) => {
      this.isAdminRoute = url.startsWith('/admin');
      this.isLoginRoute = url.startsWith('/login');
      this.isSignupRoute = url.startsWith('/signup');
    };
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        updateRouteFlags(event.url);
      }
    });
    updateRouteFlags(this.router.url);
  }

  toggleLogin(): void {
    if (this.isLoggedIn) {
      this.authService.logout();
    } else {
      const email = 'user@example.com';
      const password = 'password_example';
      const rememberMe = true;
      this.authService.login(email, password, rememberMe);
    }
  }
}
