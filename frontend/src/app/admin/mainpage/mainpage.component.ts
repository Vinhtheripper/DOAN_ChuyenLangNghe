import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { DashboardAPIService } from '../../dashboard-api.service';
import { AuthService } from '../../services/auth.service';

interface RecentActivity {
  category: string;
  item: string;
  name: string;
  action: 'edit' | 'view';
  timestamp: string;
  meta?: {
    type?: string | null;
    id?: string | null;
    status?: string | null;
  } | null;
}

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.scss']
})
export class MainpageComponent implements OnInit, OnDestroy {
  profileName: string = 'Admin';
  recentActivities: RecentActivity[] = [];
  private allActivities: RecentActivity[] = [];
  dashboardStats = [
    { label: 'Tổng đơn hàng', value: '...', trend: '' },
    { label: 'Tổng doanh thu', value: '...', trend: '' },
    { label: 'Khách hàng', value: '...', trend: '' },
    { label: 'Sản phẩm', value: '...', trend: '' }
  ];
  loadingActivities = false;
  activitiesError: string | null = null;
  private subscriptions = new Subscription();
  private readonly activityRouteMap: Record<string, string> = {
    product: '/admin/product-adm',
    blog: '/admin/blog-adm',
    order: '/admin/order-adm',
    feedback: '/admin/contact-adm'
  };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardAPIService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const profileSubscription = this.authService.getUserEmail().subscribe({
      next: (email) => {
        this.profileName = email || 'Admin';
      },
      error: () => {
        this.profileName = 'Admin';
      }
    });
    this.subscriptions.add(profileSubscription);
    this.loadDashboardOverview();
    this.loadRecentActivities();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  navigateToHome(): void {
    window.open('/', '_blank');
  }

  formatRelativeTime(timestamp: string): string {
    if (!timestamp) {
      return 'Không xác định';
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return 'Không xác định';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return 'Vừa xong';
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) {
      return `${diffWeeks} tuần trước`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} tháng trước`;
    }

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} năm trước`;
  }

  private loadRecentActivities(): void {
    this.loadingActivities = true;
    this.activitiesError = null;

    const activitiesSubscription = this.dashboardService.getRecentActivities().subscribe({
      next: (response) => {
        const activities = Array.isArray(response?.activities) ? response.activities : [];
        this.allActivities = activities
          .map((activity: RecentActivity) => ({
            ...activity,
            timestamp: activity?.timestamp || new Date().toISOString()
          }));
        this.applyActivityFilter();
        this.loadingActivities = false;
      },
      error: (error) => {
        console.error('Error fetching recent activities:', error);
        this.activitiesError = error?.error?.message || 'Không thể tải hoạt động gần đây.';
        this.allActivities = [];
        this.recentActivities = [];
        this.loadingActivities = false;
      }
    });

    this.subscriptions.add(activitiesSubscription);
  }

  private loadDashboardOverview(): void {
    const statsSubscription = this.dashboardService.getDashboardStats().subscribe({
      next: (response) => {
        const overview = response?.overview || {};
        const lowStockCount = Array.isArray(response?.lowStockProducts) ? response.lowStockProducts.length : 0;

        this.dashboardStats = [
          {
            label: 'Tổng đơn hàng',
            value: this.formatNumber(overview.totalOrders || 0),
            trend: this.buildTrendText(overview.ordersGrowth, 'so với 7 ngày trước')
          },
          {
            label: 'Tổng doanh thu',
            value: this.formatCurrency(overview.totalRevenue || 0),
            trend: this.buildTrendText(overview.revenueGrowth, 'so với 7 ngày trước')
          },
          {
            label: 'Khách hàng',
            value: this.formatNumber(overview.totalUsers || 0),
            trend: `Liên hệ mới: ${this.formatNumber(overview.newContacts || 0)}`
          },
          {
            label: 'Sản phẩm',
            value: this.formatNumber(overview.totalProducts || 0),
            trend: `Sắp hết hàng: ${this.formatNumber(lowStockCount)}`
          }
        ];
      },
      error: () => {
        this.dashboardStats = [
          { label: 'Tổng đơn hàng', value: '0', trend: '' },
          { label: 'Tổng doanh thu', value: this.formatCurrency(0), trend: '' },
          { label: 'Khách hàng', value: '0', trend: '' },
          { label: 'Sản phẩm', value: '0', trend: '' }
        ];
      }
    });

    this.subscriptions.add(statsSubscription);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  private buildTrendText(growth: number, suffix: string): string {
    if (typeof growth !== 'number' || Number.isNaN(growth)) {
      return '';
    }
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}% ${suffix}`;
  }

  private applyActivityFilter(): void {
    const permission = this.authService.getAction() || 'just view';

    if (permission === 'edit all') {
      this.recentActivities = [...this.allActivities];
      return;
    }

    this.recentActivities = this.allActivities.filter(activity => activity.action === 'view');
  }

  trackActivity(index: number, activity: RecentActivity): string {
    return activity?.meta?.id ?? `${activity.category}-${activity.item}-${index}`;
  }

  isActivityNavigable(activity: RecentActivity): boolean {
    return !!this.getActivityRoute(activity);
  }

  onActivityClick(activity: RecentActivity): void {
    const targetRoute = this.getActivityRoute(activity);
    if (!targetRoute) {
      return;
    }
    this.router.navigate([targetRoute]);
  }

  onActivityKeyup(event: Event, activity: RecentActivity): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key && keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
      return;
    }
    if (typeof keyboardEvent.preventDefault === 'function') {
      keyboardEvent.preventDefault();
    }
    this.onActivityClick(activity);
  }

  private getActivityRoute(activity: RecentActivity): string | null {
    const activityType = activity?.meta?.type;
    if (!activityType) {
      return null;
    }

    return this.activityRouteMap[activityType] || null;
  }
}
