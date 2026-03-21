import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { LocationService } from '../services/location.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderAPIService } from '../order-api.service';
import { AuthService } from '../services/auth.service';
import { UserAPIService } from '../user-api.service';

interface SavedAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  additionalNotes?: string;
}

/** Placeholder khi không có ảnh sản phẩm (data URL). */
const PAYMENT_PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect fill="%23f0f0f0" width="120" height="120"/%3E%3Ctext x="60" y="65" text-anchor="middle" fill="%23999" font-size="11" font-family="sans-serif"%3ENo image%3C/text%3E%3C/svg%3E';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  readonly placeholderImage = PAYMENT_PLACEHOLDER_IMAGE;
  selectedItems: any[] = [];
  totalPrice: number = 0;
  subtotalPrice: number = 0;
  discountAmount: number = 0;
  couponCode: string = '';
  shippingFee: number = 0;
  shippingMethod: 'standard' | 'express' = 'standard';
  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];
  paymentForm: FormGroup;
  isModalVisible = false;
  modalPaymentMethod: 'momo' | 'internet_banking' = 'momo';
  savedAddresses: SavedAddress[] = [];
  selectedAddressIndex: number = -1;

  constructor(
    private cartService: CartService,
    private locationService: LocationService,
    private fb: FormBuilder,
    private router: Router,
    private orderAPIService: OrderAPIService,
    private authService: AuthService,
    private userAPIService: UserAPIService
  ) {
    this.paymentForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^(\+?\d{1,3}[- ]?)?\d{9,11}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      selectedProvince: ['', Validators.required],
      selectedDistrict: ['', Validators.required],
      selectedWard: ['', Validators.required],
      additionalNotes: [''],
      setAsDefault: [false],
      paymentMethod: ['cash_on_delivery', Validators.required]
    });
  }

  ngOnInit(): void {
    this.selectedItems = this.cartService.getSelectedItems();
    const appliedCoupon = this.cartService.getAppliedCoupon();
    if (appliedCoupon) {
      this.couponCode = appliedCoupon.code;
      this.discountAmount = appliedCoupon.discountAmount;
    }
    this.calculateTotalPrice();
    this.loadProvinces();
    this.onShippingChange();
    if (this.authService.isLoggedIn()) {
      this.loadUserInfoAndSavedAddress();
    }
  }

  private loadUserInfoAndSavedAddress(): void {
    this.userAPIService.getUserDetails().subscribe({
      next: (user) => {
        if (user?.profileName) {
          this.paymentForm.patchValue({ fullName: user.profileName });
        }
        if (user?.phone) {
          this.paymentForm.patchValue({ phone: user.phone });
        }
        if (user?.email) {
          this.paymentForm.patchValue({ email: user.email });
        }
      },
      error: () => {}
    });
    this.orderAPIService.getLastShippingAddress().subscribe({
      next: (addr) => {
        if (addr) {
          const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ') || 'Khách hàng';
          const saved: SavedAddress = {
            fullName,
            phone: addr.phone || '',
            email: addr.email || '',
            address: addr.address || '',
            province: addr.province || '',
            district: addr.district || '',
            ward: addr.ward || '',
            provinceCode: addr.provinceCode,
            districtCode: addr.districtCode,
            wardCode: addr.wardCode,
            additionalNotes: addr.additionalNotes
          };
          this.savedAddresses = [saved];
          this.selectedAddressIndex = 0;
          this.applySavedAddress(0);
        }
      },
      error: () => {}
    });
  }

  selectSavedAddress(index: number): void {
    this.selectedAddressIndex = index;
    this.applySavedAddress(index);
  }

  private applySavedAddress(index: number): void {
    const addr = this.savedAddresses[index];
    if (!addr) return;
    this.paymentForm.patchValue({
      fullName: addr.fullName,
      phone: addr.phone,
      email: addr.email,
      address: addr.address,
      additionalNotes: addr.additionalNotes || ''
    });
    if (addr.provinceCode) {
      this.paymentForm.patchValue({ selectedProvince: addr.provinceCode });
      this.locationService.getDistricts(addr.provinceCode).subscribe({
        next: (data) => {
          this.districts = data.districts || [];
          if (addr.districtCode) {
            this.paymentForm.patchValue({ selectedDistrict: addr.districtCode });
            this.locationService.getWards(addr.districtCode).subscribe({
              next: (wData) => {
                this.wards = wData.wards || [];
                if (addr.wardCode) {
                  this.paymentForm.patchValue({ selectedWard: addr.wardCode });
                }
              }
            });
          } else {
            this.wards = [];
          }
        },
        error: () => { this.districts = []; this.wards = []; }
      });
    } else {
      this.districts = [];
      this.wards = [];
    }
  }

  editAddress(index: number): void {
    this.selectSavedAddress(index);
  }

  removeAddress(index: number): void {
    this.savedAddresses.splice(index, 1);
    if (this.selectedAddressIndex >= this.savedAddresses.length) {
      this.selectedAddressIndex = this.savedAddresses.length - 1;
    }
    if (this.savedAddresses.length > 0 && this.selectedAddressIndex >= 0) {
      this.applySavedAddress(this.selectedAddressIndex);
    } else {
      this.selectedAddressIndex = -1;
    }
  }

  updateAddressFromForm(): void {
    const v = this.paymentForm.value;
    const province = this.provinces.find(p => p.code === v.selectedProvince);
    const district = this.districts.find(d => d.code === v.selectedDistrict);
    const ward = this.wards.find(w => w.code === v.selectedWard);
    const newAddr: SavedAddress = {
      fullName: v.fullName,
      phone: v.phone,
      email: v.email,
      address: v.address,
      province: province?.name || '',
      district: district?.name || '',
      ward: ward?.name || '',
      provinceCode: v.selectedProvince,
      districtCode: v.selectedDistrict,
      wardCode: v.selectedWard,
      additionalNotes: v.additionalNotes
    };
    if (this.selectedAddressIndex >= 0 && this.savedAddresses[this.selectedAddressIndex]) {
      this.savedAddresses[this.selectedAddressIndex] = newAddr;
    } else {
      this.savedAddresses.push(newAddr);
      this.selectedAddressIndex = this.savedAddresses.length - 1;
    }
    if (v.setAsDefault) {
      this.userAPIService.updateMyProfile({
        profileName: v.fullName,
        phone: v.phone,
        address: `${v.address}, ${ward?.name || ''}, ${district?.name || ''}, ${province?.name || ''}`
      }).subscribe();
    }
    alert('Đã cập nhật địa chỉ.');
  }

  calculateTotalPrice(): void {
    this.subtotalPrice = this.selectedItems.reduce((sum, item) => {
      const qty = item.quantity ?? item.tempQuantity ?? 1;
      return sum + (item.unit_price || 0) * qty;
    }, 0);
    this.totalPrice = Math.max(this.subtotalPrice - this.discountAmount, 0);
  }

  onShippingChange(): void {
    this.shippingFee = this.shippingMethod === 'express' ? 45000 : 0;
  }

  placeOrder(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      alert('Vui lòng điền đầy đủ thông tin trước khi đặt hàng.');
      return;
    }
    if (this.selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    const pm = this.paymentForm.value.paymentMethod;
    if (pm === 'internet_banking' || pm === 'momo') {
      this.modalPaymentMethod = pm;
      this.isModalVisible = true;
    } else {
      this.processOrder();
    }
  }

  openModal(): void { this.isModalVisible = true; }
  closeModal(): void { this.isModalVisible = false; }

  handlePaymentSuccess(): void {
    this.isModalVisible = false;
    this.processOrder();
  }

  processOrder(): void {
    const items = this.selectedItems;
    const insufficient = items.filter(item => {
      const sq = item.stocked_quantity;
      const qty = item.quantity ?? item.tempQuantity ?? 1;
      return sq !== undefined && qty > sq;
    });
    if (insufficient.length > 0) {
      let msg = 'Một số sản phẩm vượt quá số lượng tồn kho:\n';
      insufficient.forEach(i => {
        const qty = i.quantity ?? i.tempQuantity ?? 1;
        msg += `- ${i.product_name}: ${qty} (tồn: ${i.stocked_quantity})\n`;
        i.quantity = i.stocked_quantity;
      });
      alert(msg);
      this.calculateTotalPrice();
      return;
    }

    const v = this.paymentForm.value;
    const orderedItems = items.map(item => ({
      _id: item.productId as string,
      quantity: item.quantity ?? item.tempQuantity ?? 1,
      unit_price: item.unit_price
    }));

    const province = this.provinces.find(p => p.code === v.selectedProvince);
    const district = this.districts.find(d => d.code === v.selectedDistrict);
    const ward = this.wards.find(w => w.code === v.selectedWard);
    const fullName = (v.fullName || '').trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const orderData = {
      selectedItems: orderedItems,
      totalPrice: this.totalPrice,
      couponCode: this.couponCode || null,
      couponDiscount: this.discountAmount || 0,
      paymentMethod: v.paymentMethod,
      shippingFee: this.shippingFee,
      shippingMethod: this.shippingMethod,
      shippingAddress: {
        firstName,
        lastName,
        address: v.address,
        province: province?.name || '',
        district: district?.name || '',
        ward: ward?.name || '',
        email: v.email,
        phone: v.phone,
        additionalNotes: v.additionalNotes,
        provinceCode: v.selectedProvince,
        districtCode: v.selectedDistrict,
        wardCode: v.selectedWard
      }
    };

    this.orderAPIService.placeOrder(orderData).subscribe({
      next: () => {
        alert('Đơn hàng của bạn đã được đặt thành công!\n\nĐể tránh mất tiền vào tay kẻ lừa đảo mạo danh Shipper, bạn tuyệt đối\nKHÔNG chuyển khoản cho Shipper khi chưa nhận hàng\nKHÔNG nhấn vào đường dẫn (Link) lạ của Shipper gửi');
        this.cartService.removeOrderedItems(orderedItems.map(i => i._id));
        this.cartService.clearSelectedItems();
        this.cartService.clearAppliedCoupon();
        this.router.navigate(['/']);
      },
      error: (err) => {
        if (err.message?.includes('Insufficient stock')) {
          alert('Một số sản phẩm không còn đủ hàng. Vui lòng cập nhật lại giỏ hàng.');
        } else {
          alert('Đặt hàng thất bại. Vui lòng thử lại.');
        }
      }
    });
  }

  loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: (data) => { this.provinces = data; },
      error: () => {}
    });
  }

  onProvinceChange(): void {
    const code = this.paymentForm.get('selectedProvince')?.value;
    if (code) {
      this.locationService.getDistricts(code).subscribe({
        next: (data) => {
          this.districts = data.districts || [];
          this.wards = [];
          this.paymentForm.patchValue({ selectedDistrict: '', selectedWard: '' });
        },
        error: () => { this.districts = []; this.wards = []; }
      });
    } else {
      this.districts = [];
      this.wards = [];
    }
  }

  onDistrictChange(): void {
    const code = this.paymentForm.get('selectedDistrict')?.value;
    if (code) {
      this.locationService.getWards(code).subscribe({
        next: (data) => {
          this.wards = data.wards || [];
          this.paymentForm.patchValue({ selectedWard: '' });
        },
        error: () => { this.wards = []; }
      });
    } else {
      this.wards = [];
    }
  }
}
