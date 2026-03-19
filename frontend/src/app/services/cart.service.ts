import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { CartAPIService } from '../cart-api.service';
import { CartItem } from '../../interface/Cart';
import { AuthService } from './auth.service';
import { tap, catchError } from 'rxjs/operators';
import { decompressFromUTF16 } from 'lz-string';

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
        const items = this.readGuestCartFromStorage();
        this.cartItems.next(items);
        this.updateCartCount(items);
      }
    });
  }

  private readGuestCartFromStorage(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    const rawItems = sessionStorage.getItem(this.cartKey);
    if (!rawItems) {
      return [];
    }

    try {
      return JSON.parse(rawItems);
    } catch {
      try {
        const decompressed = decompressFromUTF16(rawItems);
        return decompressed ? JSON.parse(decompressed) : [];
      } catch {
        return [];
      }
    }
  }

  private persistGuestCart(cartItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]): void {
    try {
      const serializedData = JSON.stringify(cartItems);
      if (serializedData.length > 5000000) {
        alert('Không thể lưu giỏ hàng vì dữ liệu quá lớn.');
        return;
      }
      sessionStorage.setItem(this.cartKey, serializedData);
    } catch (error) {
      alert('Lỗi khi lưu dữ liệu vào sessionStorage. Vui lòng thử lại.');
    }
  }

  private getCurrentCartItems(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    return [...this.cartItems.getValue()];
  }

  private upsertCartItem(
    cartItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[],
    nextItem: CartItem & { product_name: string; image_1: string; stocked_quantity: number }
  ): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    const cloned = cartItems.map((item) => ({ ...item }));
    const existingItem = cloned.find((item) => item.productId === nextItem.productId);
    if (existingItem) {
      existingItem.quantity += nextItem.quantity;
      existingItem.unit_price = nextItem.unit_price;
      existingItem.product_name = nextItem.product_name;
      existingItem.image_1 = nextItem.image_1;
      existingItem.stocked_quantity = nextItem.stocked_quantity;
      return cloned;
    }

    cloned.push({ ...nextItem });
    return cloned;
  }

  private syncGuestCart(cartItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]): void {
    this.persistGuestCart(cartItems);
    this.cartItems.next(cartItems);
    this.updateCartCount(cartItems);
  }

  private syncRuntimeCart(cartItems: (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[]): void {
    this.cartItems.next(cartItems);
    this.updateCartCount(cartItems);
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
      const previousCartItems = this.getCurrentCartItems();
      const optimisticCartItems = this.upsertCartItem(previousCartItems, {
        productId,
        quantity,
        unit_price,
        product_name,
        image_1,
        stocked_quantity,
      });
      this.cartItems.next(optimisticCartItems);
      this.updateCartCount(optimisticCartItems);

      this.cartAPIService
        .addToCart(productId, quantity, unit_price)
        .pipe(
          catchError((error) => {
            this.cartItems.next(previousCartItems);
            this.updateCartCount(previousCartItems);
            return this.handleError(error);
          })
        )
        .subscribe();
    } else {
      const cartItems = this.upsertCartItem(this.getCurrentCartItems(), {
        productId,
        quantity,
        unit_price,
        product_name,
        image_1,
        stocked_quantity,
      });
      this.syncGuestCart(cartItems);
    }
  }

  removeFromCart(productId: string): void {
    if (this.isUserLoggedIn) {
      const previousCartItems = this.getCurrentCartItems();
      const nextCartItems = previousCartItems.filter((item) => item.productId !== productId);
      this.syncRuntimeCart(nextCartItems);
      this.cartAPIService
        .removeFromCart(productId)
        .pipe(
          catchError((error) => {
            this.syncRuntimeCart(previousCartItems);
            return this.handleError(error);
          })
        )
        .subscribe();
    } else {
      const cartItems = this.getCurrentCartItems().filter((item) => item.productId !== productId);
      this.syncGuestCart(cartItems);
    }
  }

  removeOrderedItems(orderedItemIds: string[]): void {
    if (this.isUserLoggedIn) {
      const previousCartItems = this.getCurrentCartItems();
      const nextCartItems = previousCartItems.filter(
        (item) => item.productId && !orderedItemIds.includes(item.productId)
      );
      this.syncRuntimeCart(nextCartItems);
      this.cartAPIService
        .removeOrderedItems(orderedItemIds)
        .pipe(
          catchError((error) => {
            this.syncRuntimeCart(previousCartItems);
            return this.handleError(error);
          })
        )
        .subscribe();
    } else {
      const remainingItems = this.getCurrentCartItems().filter(
        (item) => item.productId && !orderedItemIds.includes(item.productId)
      );
      this.syncGuestCart(remainingItems);
    }
  }

  updateQuantity(productId: string, quantity: number): Observable<any> {
    if (this.isUserLoggedIn) {
      const previousCartItems = this.getCurrentCartItems();
      const nextCartItems = previousCartItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      this.syncRuntimeCart(nextCartItems);
      return this.cartAPIService.updateQuantity(productId, quantity).pipe(
        catchError((error) => {
          this.syncRuntimeCart(previousCartItems);
          return this.handleError(error);
        })
      );
    } else {
      const cartItems = this.getCurrentCartItems();
      const item = cartItems.find((item) => item.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
      this.syncGuestCart(cartItems);
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
      sessionStorage.removeItem(this.cartKey);
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
    if (serializedData.length > 5000000) {
      alert('Không thể lưu dữ liệu vì kích thước quá lớn. Vui lòng kiểm tra giỏ hàng.');
      return;
    }

    this.selectedItems = selectedItems;

    if (this.isUserLoggedIn) {
      this.cartAPIService.saveSelectedItems(selectedItems).pipe(catchError(this.handleError)).subscribe();
    } else {
      localStorage.setItem(this.selectedItemsKey, serializedData);
    }
  }

  loadSelectedItemsFromLocalStorage(): (CartItem & { product_name: string; image_1: string; stocked_quantity: number })[] {
    const storedItems = localStorage.getItem(this.selectedItemsKey);
    if (!storedItems) {
      return [];
    }

    try {
      return JSON.parse(storedItems);
    } catch {
      try {
        const decompressed = decompressFromUTF16(storedItems);
        return decompressed ? JSON.parse(decompressed) : [];
      } catch {
        return [];
      }
    }
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
