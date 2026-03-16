import { Component, OnInit } from '@angular/core';
import { DashboardAPIService } from '../../dashboard-api.service';
import { AuthService } from '../../services/auth.service';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  today = new Date();
  loading: boolean = false;
  canView: boolean = false;

  
  // Overview stats
  stats = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalBlogs: 0,
    totalContacts: 0,
    newContacts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  };

  recentOrders: any[] = [];
  lowStockProducts: any[] = [];
  topProducts: any[] = [];
  salesData: any[] = [];
  weeklySalesData: any[] = [];
  monthlySalesData: any[] = [];

  // Chart configurations
  public lineChartType: ChartType = 'line';
  public salesChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Doanh thu hàng ngày',
        borderColor: '#7A4726',
        backgroundColor: 'rgba(122, 71, 38, 0.12)',
        tension: 0.4,
        fill: true
      },
      {
        data: [],
        label: 'Số đơn hàng',
        borderColor: '#BA680F',
        backgroundColor: 'rgba(186, 104, 15, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ],
    labels: []
  };

  public salesChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Ngày'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Doanh thu (VNĐ)'
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Số đơn hàng'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };












  profileName = 'Admin';

  constructor(
    private dashboardService: DashboardAPIService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getUserEmail().subscribe({
      next: (email) => { this.profileName = email?.split('@')[0] || 'Admin'; }
    });
    this.setPermissions();
    if (this.canView) {
      this.loadDashboardStats();
    }
  }

  setPermissions(): void {
    const action = this.authService.getAction();
    this.canView = action === 'edit all' || action === 'sales ctrl' || action === 'just view';
  }

  loadDashboardStats(): void {
    if (!this.canView) {
      return;
    }
    this.loading = true;
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data.overview;
        this.recentOrders = data.recentOrders;
        this.lowStockProducts = data.lowStockProducts;
        this.topProducts = data.topProducts;
        this.salesData = data.salesData;
        this.weeklySalesData = data.weeklySalesData;
        this.monthlySalesData = data.monthlySalesData;
        
        // Update sales chart
        this.updateSalesChart();
        
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading dashboard:', err);
        alert('Không thể tải dữ liệu dashboard: ' + (err.error?.message || 'Lỗi không xác định'));
      }
    });
  }










  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  getOrderStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'in_progress': 'bg-warning',
      'completed': 'bg-success',
      'cancelled': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'in_progress': 'Đang xử lý',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
  }

  getGrowthIcon(growth: number): string {
    return growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  }

  getGrowthClass(growth: number): string {
    return growth >= 0 ? 'text-success' : 'text-danger';
  }

  formatGrowth(growth: number): string {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  updateSalesChart(): void {
    const labels = this.salesData.map(item => {
      const date = new Date(item._id);
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    });
    
    const revenueData = this.salesData.map(item => item.dailyRevenue);
    const ordersData = this.salesData.map(item => item.dailyOrders);

    this.salesChartData = {
      datasets: [
        {
          data: revenueData,
          label: 'Doanh thu hàng ngày',
          borderColor: '#7A4726',
          backgroundColor: 'rgba(122, 71, 38, 0.12)',
          tension: 0.4,
          fill: true
        },
        {
          data: ordersData,
          label: 'Số đơn hàng',
          borderColor: '#BA680F',
          backgroundColor: 'rgba(186, 104, 15, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ],
      labels: labels
    };
  }
}
