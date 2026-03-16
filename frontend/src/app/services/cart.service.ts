import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { CartAPIService } from '../cart-api.service';
import { CartItem } from '../../interface/Cart';
import { AuthService } from './auth.service';
import { tap, catchError } from 'rxjs/operators';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartKey = 'cartItems_guest';
  private selectedItemsKey = 'selectedItems_guest';

  private cartItems = new BehaviorSubject<(CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]>([]);
  cartItems$ = this.cartItems.asObservable();

  private cartItemsCount = new BehaviorSubject<number>(0);
  cartItemsCount$ = this.cartItemsCount.asObservable();

  private selectedItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] = [];
  private appliedCoupon: { code: string; discountAmount: number } | null = null;
  private isUserLoggedIn = false;

  constructor(
    private cartAPIService: CartAPIService,
    private authService: AuthService
  ) {
    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isUserLoggedIn = loggedIn;
      if (loggedIn) {
        this.loadCartFromDatabase();
      } else {
        const items = this.getCartItemsFromSessionStorage();
        this.cartItems.next(items);
        this.updateCartCount(items);
      }
    });
  }

  private getCartItemsFromSessionStorage(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    const compressedItems = sessionStorage.getItem(this.cartKey);
    return compressedItems ? JSON.parse(decompressFromUTF16(compressedItems)) : [];
  }

  private saveCartItemsToSessionStorage(cartItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]): void {
    try {
      const serializedData = JSON.stringify(cartItems);
      const compressedData = compressToUTF16(serializedData);
      if (compressedData.length > 5000000) {
        alert('Không thể lưu giỏ hàng vì dữ liệu quá lớn.');
        return;
      }
      sessionStorage.setItem(this.cartKey, compressedData);
    } catch (error) {
      alert('Lỗi khi lưu dữ liệu vào sessionStorage. Vui lòng thử lại.');
    }
  }

  private freeUpStorageIfNecessary(): void {
    while (!this.isStorageAvailable() && localStorage.length > 0) {
      const keyToRemove = localStorage.key(0);
      if (keyToRemove) {
        localStorage.removeItem(keyToRemove);
      }
    }
  }

  private isStorageAvailable(): boolean {
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => new Error('An error occurred while processing the cart'));
  }

  getCartItems(): Observable<(CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]> {
    return this.cartItems$;
  }

  addToCart(
    productId: string,
    quantity: number = 1,
    unit_price: number,
    product_name: string,
    image_1: string,
    stocked_quantity: number
  ): void {
    if (this.isUserLoggedIn) {
      this.cartAPIService
        .addToCart(productId, quantity, unit_price)
        .pipe(
          tap(() => this.loadCartFromDatabase()),
          catchError(this.handleError)
        )
        .subscribe();
    } else {
      const cartItems = this.getCartItemsFromSessionStorage();
      const existingItem = cartItems.find((item) => item.productId === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cartItems.push({
          productId,
          quantity,
          unit_price,
          product_name,
          image_1,
          stocked_quantity,
        });
      }
      this.saveCartItemsToSessionStorage(cartItems);
      this.cartItems.next(cartItems);
      this.updateCartCount(cartItems);
    }
  }

  removeFromCart(productId: string): void {
    if (this.isUserLoggedIn) {
      this.cartAPIService
        .removeFromCart(productId)
        .pipe(
          tap(() => this.loadCartFromDatabase()),
          catchError(this.handleError)
        )
        .subscribe();
    } else {
      const cartItems = this.getCartItemsFromSessionStorage().filter((item) => item.productId !== productId);
      this.saveCartItemsToSessionStorage(cartItems);
      this.cartItems.next(cartItems);
      this.updateCartCount(cartItems);
    }
  }

  removeOrderedItems(orderedItemIds: string[]): void {
    if (this.isUserLoggedIn) {
      this.cartAPIService
        .removeOrderedItems(orderedItemIds)
        .pipe(
          tap(() => this.loadCartFromDatabase()),
          catchError(this.handleError)
        )
        .subscribe();
    } else {
      const remainingItems = this.getCartItemsFromSessionStorage().filter(
        (item) => item.productId && !orderedItemIds.includes(item.productId)
      );
      this.saveCartItemsToSessionStorage(remainingItems);
      this.cartItems.next(remainingItems);
      this.updateCartCount(remainingItems);
    }
  }

  updateQuantity(productId: string, quantity: number): Observable<any> {
    if (this.isUserLoggedIn) {
      return this.cartAPIService.updateQuantity(productId, quantity).pipe(
        tap(() => this.loadCartFromDatabase()),
        catchError(this.handleError)
      );
    } else {
      const cartItems = this.getCartItemsFromSessionStorage();
      const item = cartItems.find((item) => item.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
      this.saveCartItemsToSessionStorage(cartItems);
      this.cartItems.next(cartItems);
      this.updateCartCount(cartItems);
      return of(null);
    }
  }

  clearCart(): void {
    if (this.isUserLoggedIn) {
      this.cartAPIService
        .clearCart()
        .pipe(
          tap(() => {
            this.cartItems.next([]);
            this.updateCartCount([]);
          }),
          catchError(this.handleError)
        )
        .subscribe();
    } else {
      localStorage.removeItem(this.cartKey);
      this.cartItems.next([]);
      this.updateCartCount([]);
    }
    this.clearSelectedItems();
    this.clearAppliedCoupon();
  }

  private loadCartFromDatabase(): void {
    this.cartAPIService
      .getCartItems()
      .pipe(
        tap((cartItems) => {
          const mappedItems = cartItems.map((item) => ({
            ...item,
            product_name: item.product_name || 'Tên sản phẩm',
            image_1: item.image_1 || 'default-image.jpg',
            stocked_quantity: item.stocked_quantity ?? 0,
          }));

          if (this.selectedItems.length > 0) {
            const buyNowItem = this.selectedItems[0];
            const existingIndex = mappedItems.findIndex(item => item.productId === buyNowItem.productId);
            if (existingIndex >= 0) {
              mappedItems[existingIndex].quantity += buyNowItem.quantity;
            } else {
              mappedItems.push(buyNowItem);
            }
            this.selectedItems = [];
          }

          this.cartItems.next(mappedItems);
          this.updateCartCount(mappedItems);
        }),
        catchError(this.handleError)
      )
      .subscribe();
  }

  private updateCartCount(cartItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]): void {
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.cartItemsCount.next(totalCount);
  }

  getSelectedItems(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    return this.selectedItems;
  }

  saveSelectedItems(selectedItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]): void {
    const serializedData = JSON.stringify(selectedItems);
    const compressedData = compressToUTF16(serializedData);

    if (compressedData.length > 5000000) {
      alert('Không thể lưu dữ liệu vì kích thước quá lớn. Vui lòng kiểm tra giỏ hàng.');
      return;
    }

    this.selectedItems = selectedItems;

    if (this.isUserLoggedIn) {
      this.cartAPIService.saveSelectedItems(selectedItems).pipe(catchError(this.handleError)).subscribe();
    } else {
      localStorage.setItem(this.selectedItemsKey, compressedData);
    }
  }

  loadSelectedItemsFromLocalStorage(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    const compressedItems = localStorage.getItem(this.selectedItemsKey);
    return compressedItems ? JSON.parse(decompressFromUTF16(compressedItems)) : [];
  }

  clearSelectedItems(): void {
    this.selectedItems = [];
    localStorage.removeItem(this.selectedItemsKey);
  }

  setAppliedCoupon(coupon: { code: string; discountAmount: number } | null): void {
    this.appliedCoupon = coupon;
    if (coupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }

  getAppliedCoupon(): { code: string; discountAmount: number } | null {
    if (this.appliedCoupon) return this.appliedCoupon;
    const raw = localStorage.getItem('appliedCoupon');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.code && typeof parsed?.discountAmount === 'number') {
        this.appliedCoupon = parsed;
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  clearAppliedCoupon(): void {
    this.appliedCoupon = null;
    localStorage.removeItem('appliedCoupon');
  }

  saveSingleProductForCheckout(
    productId: string,
    quantity: number,
    unit_price: number,
    product_name: string,
    image_1: string,
    stocked_quantity: number
  ): void {
    const singleItemCart = {
      productId,
      quantity,
      unit_price,
      product_name,
      image_1,
      stocked_quantity,
    };

    this.selectedItems = [singleItemCart];

    const cartItems = this.cartItems.getValue();
    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      cartItems.push(singleItemCart);
    }

    this.cartItems.next(cartItems);
    this.updateCartCount(cartItems);
  }

  getSingleProductForCheckout(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number }) | null {
    const currentItems = this.cartItems.getValue();
    return currentItems.length === 1 ? currentItems[0] : null;
  }
}
