import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartItemCount: number = 0;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  searchTerm: string = '';
  isScrolled: boolean = false;
  showProductsDropdown: boolean = false;
  private dropdownTimeout: any = null;
  private logoutSubscription: Subscription | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
  ) { }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled = scrollTop > 50;
  }

  ngOnInit(): void {
    this.cartService.cartItemsCount$.subscribe(count => {
      this.cartItemCount = count;
    });

    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      this.isAdmin = this.authService.isAdmin();
    });

    this.logoutSubscription = this.authService.logoutEvent$.subscribe(() => {
      this.isAdmin = false;
      this.router.navigate(['/']);
    });
  }

  performSearch(searchInput: HTMLInputElement): void {
    if (this.searchTerm.trim()) {
      const searchValue = this.searchTerm;
      this.router.navigate(['/catalog']).then(() => {
        this.router.navigate(['/catalog'], { queryParams: { search: searchValue } });
        searchInput.blur();
      });
    }
  }

  handleLogout(): void {
    if (this.isLoggedIn) {
      this.authService.logout();
    } else {
      this.router.navigate(['/login']);
    }
  }

  hideProductsDropdown(): void {
    this.dropdownTimeout = setTimeout(() => {
      this.showProductsDropdown = false;
    }, 300); // 300ms delay before hiding
  }

  clearDropdownTimeout(): void {
    if (this.dropdownTimeout) {
      clearTimeout(this.dropdownTimeout);
      this.dropdownTimeout = null;
    }
  }

  ngOnDestroy(): void {
    if (this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
    if (this.dropdownTimeout) {
      clearTimeout(this.dropdownTimeout);
    }
  }
}
