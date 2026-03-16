import { Component, OnInit } from '@angular/core';
import { OrderAPIService } from '../../order-api.service';
import { AuthService } from '../../services/auth.service';
import { Order } from '../../../interface/Order';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {
  orders: Order[] = [];
  filterOption: string = 'orderId';
  searchQuery: string = '';
  statusFilter: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalOrders: number = 0;
  canEdit: boolean = false;
  canView: boolean = false;

  statusOptions = [
    { value: 'in_progress', label: 'Đang xử lý', icon: 'fas fa-hourglass-half', iconClass: 'text-warning' },
    { value: 'delivered', label: 'Đã giao', icon: 'fas fa-truck', iconClass: 'text-primary' },
    { value: 'completed', label: 'Hoàn tất', icon: 'fas fa-check-circle', iconClass: 'text-success' }
  ];

  constructor(
    private orderService: OrderAPIService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setPermissions();
    if (this.canView) {
      this.loadOrders();
    } else {
      console.warn('You do not have permission to view orders.');
    }
  }

  setPermissions(): void {
    const action = this.authService.getAction();
    this.canEdit = action === 'edit all' || action === 'sales ctrl';
    this.canView = this.canEdit || action === 'just view';
  }

  get totalPages(): number {
    return Math.ceil(this.totalOrders / this.pageSize);
  }

  loadOrders(): void {
    try {
      this.orderService.getOrders(this.currentPage, this.pageSize, this.searchQuery, this.statusFilter).subscribe({
        next: (data) => {
          this.orders = data.orders.map(order => ({
            ...order,
            userName: order.userName || 'Anonymous',
            createdAt: new Date(order.createdAt)
          }));
          this.totalOrders = data.total;
        },
        error: (err) => {
          alert('An error occurred while loading the order. Please try again.');
        }
      });
    } catch (error) {
      alert('An unexpected error occurred while loading orders.');
    }
  }

  updateOrderStatus(order: Order, newStatus: string): void {
    if (!this.canEdit) {
      alert('You do not have permission to change the order status.');
      return;
    }

    if (!order._id) return;

    if (!confirm(`Are you sure you want to update the status to ${newStatus}?`)) return;

    try {
      this.orderService.updateOrderStatus(order._id, newStatus).subscribe({
        next: () => {
          order.status = newStatus;
        },
        error: (err) => {
          alert('Failed to update order status. Please try again.');
        }
      });
    } catch (error) {
      alert('An unexpected error occurred while updating the order status.');
    }
  }

  cancelOrder(orderId: string): void {
    if (!this.canEdit) {
      return;
    }

    if (!orderId) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => this.loadOrders(),
        error: (err) => {
          alert('Failed to cancel the order. Please try again.');
        }
      });
    } catch (error) {
      alert('An unexpected error occurred while canceling the order.');
    }
  }

  downloadInvoice(orderId: string): void {
    try {
      this.orderService.downloadInvoice(orderId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice_${orderId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          alert('Failed to download the invoice. Please try again.');
        }
      });
    } catch (error) {
      alert('An unexpected error occurred while downloading the invoice.');
    }
  }

  getStatusIcon(status: string): string {
    return this.statusOptions.find(option => option.value === status)?.icon || '';
  }

  getStatusClass(status: string): string {
    return this.statusOptions.find(option => option.value === status)?.iconClass || '';
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(option => option.value === status)?.label || '';
  }

  createOrder(): void {
    console.log('Create order functionality to be implemented.');
  }

  isPaid(order: Order): boolean {
    return order.paymentMethod !== 'cash_on_delivery' || order.status === 'completed';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }
}
