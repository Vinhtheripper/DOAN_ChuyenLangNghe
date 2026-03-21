import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAPIService } from '../user-api.service';
import { OrderAPIService } from '../order-api.service';
import { CartService } from '../services/cart.service';
import { User } from '../../interface/User';
import { DateService } from '../services/date.service';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css']
})
export class PersonalInfoComponent implements OnInit {
  personalInfo: Partial<User> = {
    birthDate: { day: '', month: '', year: '' }
  };
  originalInfo: Partial<User> = {
    birthDate: { day: '', month: '', year: '' }
  };
  isEditing = false;
  avatarPreview: string | null = null;

  months: string[] = [];
  days: number[] = [];
  years: number[] = [];

  purchaseHistory: { order: any; item: any }[] = [];
  orderPage = 1;
  orderPages = 0;
  orderTotal = 0;
  orderLimit = 10;
  orderLoading = false;

  constructor(
    private userAPIService: UserAPIService,
    private dateService: DateService,
    private orderAPIService: OrderAPIService,
    private cartService: CartService,
    private router: Router
  ) { }

  private cloneUser(user: Partial<User>): Partial<User> {
    return {
      ...user,
      avatar: (user as any).avatar ?? '',
      birthDate: user?.birthDate ? { ...user.birthDate } : { day: '', month: '', year: '' }
    };
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadPurchaseHistory();
    this.months = this.dateService.getMonths();
    this.days = this.dateService.getDays();
    this.years = this.dateService.getYears();
  }

  get points(): number {
    return (this.personalInfo.memberPoints as number) || 0;
  }

  get tierKey(): 'member' | 'silver' | 'gold' | 'platinum' {
    const p = this.points;
    if (p >= 1000) return 'platinum';
    if (p >= 500) return 'gold';
    if (p >= 100) return 'silver';
    return 'member';
  }

  get tierName(): string {
    switch (this.tierKey) {
      case 'silver': return 'Bạc';
      case 'gold': return 'Vàng';
      case 'platinum': return 'Platinum';
      default: return 'Member';
    }
  }

  get progressToNext(): number {
    const pct = this.points % 100;
    return pct;
  }

  get remainingToNext(): number {
    return 100 - (this.points % 100);
  }

  loadUserInfo(): void {
    this.userAPIService.getUserDetails().subscribe({
      next: (user) => {
        const hydratedUser = this.cloneUser({
          ...user,
          _id: user._id || '',
          memberPoints: user.memberPoints || 0,
          memberTier: user.memberTier || 'Member'
        });
        this.personalInfo = this.cloneUser(hydratedUser);
        this.originalInfo = this.cloneUser(hydratedUser);
        this.avatarPreview = (user as any).avatar || null;
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      }
    });
  }

  editInfo(): void {
    this.isEditing = true;
    this.avatarPreview = (this.personalInfo as any).avatar || this.avatarPreview || null;
  }

  saveInfo(): void {
    const updateData: any = { ...this.personalInfo };
    delete updateData._id;
    delete updateData.email;
    if (this.avatarPreview !== undefined) {
      updateData.avatar = this.avatarPreview;
    }

    this.userAPIService.updateMyProfile(updateData).subscribe({
      next: (res) => {
        this.isEditing = false;
        if (res?.user) {
          const refreshed = this.cloneUser({
            ...res.user,
            _id: res.user._id || this.personalInfo._id || ''
          });
          this.personalInfo = this.cloneUser(refreshed);
          this.originalInfo = this.cloneUser(refreshed);
          this.avatarPreview = refreshed.avatar ? refreshed.avatar : null;
        } else {
          this.loadUserInfo();
        }
      },
      error: (err) => {
        console.error('Error updating user info:', err);
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.personalInfo = this.cloneUser(this.originalInfo);
    this.avatarPreview = (this.originalInfo as any).avatar || null;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      (this.personalInfo as any).avatar = this.avatarPreview;
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    (this.personalInfo as any).avatar = '';
  }

  loadPurchaseHistory(): void {
    this.orderLoading = true;
    this.orderAPIService.getMyOrders(this.orderPage, this.orderLimit).subscribe({
      next: (res) => {
        this.orderTotal = res.total;
        this.orderPages = res.pages;
        const items: { order: any; item: any }[] = [];
        (res.orders || []).forEach((order: any) => {
          (order.selectedItems || []).forEach((item: any) => {
            items.push({ order, item });
          });
        });
        this.purchaseHistory = items;
        this.orderLoading = false;
      },
      error: () => {
        this.orderLoading = false;
      }
    });
  }

  get orderPageNumbers(): number[] {
    return Array.from({ length: this.orderPages }, (_, i) => i + 1);
  }

  goToOrderPage(p: number): void {
    if (p < 1 || p > this.orderPages) return;
    this.orderPage = p;
    this.loadPurchaseHistory();
  }

  formatPrice(price: number): string {
    return (price ?? 0).toLocaleString('vi-VN') + ' VND';
  }

  buyAgain(entry: { order: any; item: any }): void {
    const id = entry.item._id;
    const qty = entry.item.quantity || 1;
    const unitPrice = entry.item.unit_price || 0;
    const name = entry.item.product_name || 'Sản phẩm';
    const img = entry.item.image_1 || '';
    this.cartService.addToCart(id, qty, unitPrice, name, img, 999);
    this.router.navigate(['/cart']);
  }

  goToProductDetail(entry: { order: any; item: any }): void {
    const id = entry.item._id;
    this.router.navigate(['/product', id]);
  }
}
