import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  pageTitle = 'Trang chủ';
  profileName = 'Admin User';
  userRole = '';
  userAction = '';
  private subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.setupDynamicPageTitle();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadUserProfile(): void {
    this.subscription = this.authService.getUserEmail().subscribe({
      next: (email) => {
        this.profileName = email || 'Admin User';
        this.userRole = this.authService.isAdmin() ? 'admin' : 'user';
        this.userAction = this.authService.getAction() || 'just view';
      },
      error: () => {
        this.profileName = 'Admin User';
        this.userRole = 'unknown';
        this.userAction = 'unknown';
      }
    });
  }

  private setupDynamicPageTitle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        this.pageTitle = data['title'] || 'Admin Dashboard';
      });
  }

  canAccessFeature(requiredAction: string): boolean {
    return this.userRole === 'admin' && (this.userAction === requiredAction || this.userAction === 'edit all');
  }

  confirmLogout(): void {
    if (confirm('Are you sure you want to log out?')) {
      this.logout();
    }
  }

  logout(): void {
    this.authService.logout();
    this.authService.logoutEvent$.subscribe(() => {
      this.router.navigate(['/']).then(() => {
        window.location.reload();
      });
    });
  }
}
