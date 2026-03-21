import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Coupon {
  _id?: string;
  code: string;
  description?: string;
  type: 'percentage' | 'item_threshold_amount';
  percentageOff?: number | null;
  minItems?: number | null;
  discountAmount?: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  isActive: boolean;
  validFrom?: string | Date | null;
  validTo?: string | Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class CouponAPIService {
  private readonly baseUrl = '/coupons';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  getAdminCoupons(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, {
      withCredentials: true,
      headers: this.getHeaders()
    });
  }

  createCoupon(payload: Coupon): Observable<any> {
    return this.http.post(this.baseUrl, payload, {
      withCredentials: true,
      headers: this.getHeaders()
    });
  }

  updateCoupon(id: string, payload: Partial<Coupon>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}`, payload, {
      withCredentials: true,
      headers: this.getHeaders()
    });
  }

  validateCoupon(code: string, selectedItems: Array<{ quantity: number; unit_price: number }>): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate`, { code, selectedItems }, {
      withCredentials: true,
      headers: this.getHeaders()
    });
  }
}
