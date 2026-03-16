import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Coupon, CouponAPIService } from '../../coupon-api.service';

@Component({
  selector: 'app-coupon-management',
  templateUrl: './coupon-management.component.html',
  styleUrls: ['./coupon-management.component.css']
})
export class CouponManagementComponent implements OnInit {
  couponForm: FormGroup;
  coupons: Coupon[] = [];
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private couponAPIService: CouponAPIService
  ) {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['percentage', Validators.required],
      percentageOff: [10, [Validators.min(1), Validators.max(100)]],
      minItems: [3, [Validators.min(1)]],
      discountAmount: [50000, [Validators.min(1000)]],
      usageLimit: [1000, [Validators.min(1)]],
      validFrom: [''],
      validTo: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  get isPercentageType(): boolean {
    return this.couponForm.get('type')?.value === 'percentage';
  }

  loadCoupons(): void {
    this.loading = true;
    this.couponAPIService.getAdminCoupons(1, 50).subscribe({
      next: (res) => {
        this.coupons = res?.coupons || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Không thể tải danh sách mã giảm giá.');
      }
    });
  }

  submitCoupon(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.couponForm.value;

    const payload: Coupon = {
      code: String(formValue.code || '').trim().toUpperCase(),
      description: formValue.description,
      type: formValue.type,
      isActive: !!formValue.isActive,
      usageLimit: formValue.usageLimit ? Number(formValue.usageLimit) : null,
      validFrom: formValue.validFrom || null,
      validTo: formValue.validTo || null,
      percentageOff: null,
      minItems: null,
      discountAmount: null
    };

    if (payload.type === 'percentage') {
      payload.percentageOff = Number(formValue.percentageOff || 0);
    } else {
      payload.minItems = Number(formValue.minItems || 0);
      payload.discountAmount = Number(formValue.discountAmount || 0);
    }

    this.couponAPIService.createCoupon(payload).subscribe({
      next: () => {
        alert('Tạo mã giảm giá thành công.');
        this.submitting = false;
        this.couponForm.patchValue({
          code: '',
          description: '',
          type: 'percentage',
          percentageOff: 10,
          minItems: 3,
          discountAmount: 50000,
          usageLimit: 1000,
          validFrom: '',
          validTo: '',
          isActive: true
        });
        this.loadCoupons();
      },
      error: (err) => {
        this.submitting = false;
        alert(err?.error?.message || 'Không thể tạo mã giảm giá.');
      }
    });
  }

  toggleCouponStatus(coupon: Coupon): void {
    if (!coupon._id) return;
    this.couponAPIService.updateCoupon(coupon._id, { isActive: !coupon.isActive }).subscribe({
      next: () => this.loadCoupons(),
      error: () => alert('Không thể cập nhật trạng thái mã giảm giá.')
    });
  }

  formatRule(coupon: Coupon): string {
    if (coupon.type === 'percentage') {
      return `Giảm ${coupon.percentageOff || 0}%`;
    }
    return `Mua từ ${coupon.minItems || 0} món giảm ${new Intl.NumberFormat('vi-VN').format(coupon.discountAmount || 0)}đ`;
  }
}
