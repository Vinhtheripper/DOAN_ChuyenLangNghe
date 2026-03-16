import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CartItem } from '../../interface/Cart';
import { Router } from '@angular/router';
import { CouponAPIService } from '../coupon-api.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  cartItems: (CartItem & {
    isSelected: boolean;
    tempQuantity: number;
    product_name?: string;
    image_1?: string;
    stocked_quantity?: number;
  })[] = [];
  totalSelectedPrice: number = 0;
  discountAmount: number = 0;
  finalTotal: number = 0;
  couponCode: string = '';
  couponMessage: string = '';
  appliedCouponCode: string = '';
  applyingCoupon: boolean = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private couponAPIService: CouponAPIService
  ) { }

  ngOnInit(): void {
    this.loadCartItems();
  }

  private loadCartItems(): void {
    this.cartService.getCartItems().subscribe((items) => {
      this.cartItems = items.map((item) => ({
        ...item,
        product_name: item.product_name || 'Queentin',
        image_1: item.image_1 || 'assets/default-image.png',
        isSelected: true,
        tempQuantity: Math.min(item.quantity, item.stocked_quantity || item.quantity),
      }));
      this.updateTotalSelectedPrice();
    });
  }

  toggleSelectAll(): void {
    this.cartItems.forEach((item) => (item.isSelected = true));
    this.updateTotalSelectedPrice();
  }

  onItemSelectChange(): void {
    this.clearCouponState();
    this.updateTotalSelectedPrice();
  }

  confirmRemoveFromCart(productId: string | null): void {
    if (!productId) return;
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.removeFromCart(productId);
    }
  }

  private removeFromCart(productId: string | null): void {
    if (!productId) return;
    this.cartService.removeFromCart(productId);
    this.cartItems = this.cartItems.filter((item) => item.productId !== productId);
    this.updateTotalSelectedPrice();
  }

  increaseQuantity(item: CartItem & { isSelected: boolean; tempQuantity: number }): void {
    if (item.tempQuantity < (item.stocked_quantity || 0)) {
      item.tempQuantity += 1;
      this.clearCouponState();
      this.updateTotalSelectedPrice();
    }
  }

  decreaseQuantity(item: CartItem & { isSelected: boolean; tempQuantity: number }): void {
    if (item.tempQuantity > 1) {
      item.tempQuantity -= 1;
      this.clearCouponState();
      this.updateTotalSelectedPrice();
    }
  }

  updateTempQuantity(productId: string | null, quantity: number): void {
    if (!productId) return;
    const item = this.cartItems.find((item) => item.productId === productId);
    if (item) {
      item.tempQuantity = Math.min(Math.max(quantity, 1), item.stocked_quantity || 0);
      this.clearCouponState();
      this.updateTotalSelectedPrice();
    }
  }

  saveChanges(productId: string | null): void {
    if (!productId) return;
    const item = this.cartItems.find((item) => item.productId === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.tempQuantity).subscribe(() => {
        alert('Sản phẩm đã được lưu thành công.');
        this.loadCartItems();
      });
    }
  }

  updateTotalSelectedPrice(): void {
    this.totalSelectedPrice = this.cartItems
      .filter((item) => item.isSelected)
      .reduce((total, item) => total + item.unit_price * item.tempQuantity, 0);
    this.finalTotal = Math.max(this.totalSelectedPrice - this.discountAmount, 0);
  }

  proceedToCheckout(): void {
    const selectedItemsList = this.cartItems
      .filter((item) => item.isSelected)
      .map((item) => ({
        ...item,
        quantity: item.tempQuantity
      }));

    if (selectedItemsList.length > 0) {
      this.cartService.saveSelectedItems(selectedItemsList);
      if (this.appliedCouponCode && this.discountAmount > 0) {
        this.cartService.setAppliedCoupon({
          code: this.appliedCouponCode,
          discountAmount: this.discountAmount
        });
      } else {
        this.cartService.clearAppliedCoupon();
      }
      this.router.navigate(['/payment']);
    } else {
      alert('Vui lòng tick chọn ít nhất một sản phẩm để thanh toán.');
    }
  }

  applyCoupon(): void {
    const code = this.couponCode.trim();
    if (!code) {
      this.couponMessage = 'Vui lòng nhập mã ưu đãi.';
      return;
    }

    const selectedItems = this.cartItems
      .filter((item) => item.isSelected)
      .map((item) => ({ quantity: item.tempQuantity, unit_price: item.unit_price }));

    if (selectedItems.length === 0) {
      this.couponMessage = 'Vui lòng chọn ít nhất một sản phẩm để áp mã.';
      return;
    }

    this.applyingCoupon = true;
    this.couponAPIService.validateCoupon(code, selectedItems).subscribe({
      next: (res) => {
        this.discountAmount = Number(res?.discountAmount || 0);
        this.appliedCouponCode = String(res?.coupon?.code || code).toUpperCase();
        this.couponMessage = `Áp dụng mã thành công: -${new Intl.NumberFormat('vi-VN').format(this.discountAmount)}đ`;
        this.updateTotalSelectedPrice();
        this.applyingCoupon = false;
      },
      error: (err) => {
        this.discountAmount = 0;
        this.appliedCouponCode = '';
        this.updateTotalSelectedPrice();
        this.couponMessage = err?.error?.message || 'Mã ưu đãi không hợp lệ.';
        this.applyingCoupon = false;
      }
    });
  }

  private clearCouponState(): void {
    if (this.discountAmount > 0 || this.appliedCouponCode) {
      this.discountAmount = 0;
      this.appliedCouponCode = '';
      this.couponMessage = 'Giỏ hàng đã thay đổi, vui lòng áp lại mã ưu đãi.';
      this.cartService.clearAppliedCoupon();
    }
  }
}
