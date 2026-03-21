import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Order } from '../interface/Order';

@Injectable({
  providedIn: 'root'
})
export class OrderAPIService {
  private apiUrl = '/orders';
  private productStockUrl = '/products';
  private token: string | null = null;

  constructor(private http: HttpClient) { }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(error: any): Observable<never> {
    const errorMessage =
      error?.error?.message ||
      (error.status === 413
        ? 'Payload quá lớn, vui lòng thử lại với dữ liệu nhỏ hơn.'
        : 'Đã xảy ra lỗi không xác định.');
    return throwError(() => new Error(errorMessage));
  }

  getOrders(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = ''
  ): Observable<{ orders: Order[]; total: number }> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (search) params.search = search;
    if (status) params.status = status;

    return this.http
      .get<{ orders: Order[]; total: number }>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
        withCredentials: true
      })
      .pipe(
        map(data => {
          data.orders.forEach(order => {
            order.userName = order.userName || 'Anonymous';
          });
          return data;
        }),
        catchError(this.handleError)
      );
  }

  placeOrder(orderData: {
    selectedItems: { _id: string; quantity: number; unit_price: number }[];
    totalPrice: number;
    paymentMethod: string;
    shippingFee?: number;
    shippingMethod?: string;
    shippingAddress: {
      firstName: string;
      lastName: string;
      company?: string;
      address: string;
      province: string;
      district: string;
      ward: string;
      email: string;
      phone: string;
      additionalNotes?: string;
      provinceCode?: string;
      districtCode?: string;
      wardCode?: string;
    };
  }): Observable<{ orderId: string; message: string }> {
    if (!Array.isArray(orderData.selectedItems) || orderData.selectedItems.length === 0) {
      return throwError(() => new Error('selectedItems must be a non-empty array.'));
    }
    for (const item of orderData.selectedItems) {
      if (
        !item._id ||
        typeof item.quantity !== 'number' ||
        item.quantity <= 0 ||
        typeof item.unit_price !== 'number' ||
        item.unit_price < 0
      ) {
        return throwError(() => new Error('Invalid format in selectedItems.'));
      }
    }

    if (!orderData.totalPrice || typeof orderData.totalPrice !== 'number' || orderData.totalPrice <= 0) {
      return throwError(() => new Error('Invalid totalPrice.'));
    }

    if (!orderData.paymentMethod || typeof orderData.paymentMethod !== 'string') {
      return throwError(() => new Error('Invalid paymentMethod.'));
    }

    const address = orderData.shippingAddress;
    if (
      !address.firstName ||
      !address.lastName ||
      !address.address ||
      typeof address.firstName !== 'string' ||
      typeof address.lastName !== 'string' ||
      typeof address.address !== 'string'
    ) {
      return throwError(() => new Error('Invalid shippingAddress.'));
    }
    return this.http
      .post<{ orderId: string; message: string }>(this.apiUrl, orderData, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  updateOrderStatus(orderId: string, status: string): Observable<{ message: string }> {
    if (!orderId || typeof orderId !== 'string') {
      return throwError(() => new Error('Invalid orderId.'));
    }

    if (!status || typeof status !== 'string') {
      return throwError(() => new Error('Invalid status.'));
    }
    return this.http
      .patch<{ message: string }>(`${this.apiUrl}/${orderId}/status`, { status }, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  cancelOrder(orderId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${orderId}`, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  getOrderHistory(userId: string): Observable<Order[]> {
    return this.http
      .get<Order[]>(`${this.apiUrl}/history/${userId}`, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** Địa chỉ giao hàng từ đơn hàng gần nhất (để tự điền cho lần mua sau) */
  getLastShippingAddress(): Observable<{
    firstName: string;
    lastName: string;
    address: string;
    province: string;
    district: string;
    ward: string;
    email: string;
    phone: string;
    additionalNotes?: string;
    provinceCode?: string;
    districtCode?: string;
    wardCode?: string;
    company?: string;
  } | null> {
    return this.http
      .get<any>(`${this.apiUrl}/me/last-address`, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** Đơn hàng của user đang đăng nhập */
  getMyOrders(page: number = 1, limit: number = 10): Observable<{ orders: any[]; total: number; page: number; pages: number }> {
    return this.http
      .get<{ orders: any[]; total: number; page: number; pages: number }>(`${this.apiUrl}/me`, {
        headers: this.getHeaders(),
        withCredentials: true,
        params: { page: page.toString(), limit: limit.toString() }
      })
      .pipe(catchError(this.handleError));
  }

  updateProductStock(productId: string, quantity: number): Observable<any> {
    if (!productId || typeof productId !== 'string') {
      return throwError(() => new Error('Invalid productId.'));
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return throwError(() => new Error('quantity must be a positive number.'));
    }
    return this.http
      .patch<any>(`${this.productStockUrl}/${productId}/update-stock`, { quantity }, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  downloadInvoice(orderId: string): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${orderId}/invoice`, {
        headers: this.getHeaders(),
        responseType: 'blob',
        withCredentials: true,
      })
      .pipe(catchError(this.handleError));
  }
}
