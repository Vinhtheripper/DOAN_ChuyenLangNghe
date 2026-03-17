import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../interface/Product';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { ProductAPIService } from '../product-api.service';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductItemComponent implements OnChanges {
  @Input() product!: Product;
  isLiked: boolean = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private productService: ProductAPIService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      this.syncLikedState();
    }
  }

  goToDetail(): void {
    if (this.product._id) {
      this.router.navigate(['/product', this.product._id]);
    }
  }

  toggleLike(event: Event): void {
    event.stopPropagation();
    if (this.isLoggedIn()) {
      this.isLiked = !this.isLiked;
      this.updateLikedProducts();
    } else {
      alert("Vui lòng đăng nhập để thả tim cho sản phẩm!");
    }
  }

  private updateLikedProducts(): void {
    if (this.product._id) {
      const likedProducts = this.authService.getLikedProducts();
      if (this.isLiked) {
        likedProducts.push(this.product._id);
      } else {
        const index = likedProducts.indexOf(this.product._id);
        if (index !== -1) likedProducts.splice(index, 1);
      }
      this.authService.saveLikedProducts(likedProducts);
    }
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    if (this.product) {
      this.cartService.addToCart(
        this.product._id,
        1,
        this.product.unit_price,
        this.product.product_name,
        this.product.image_1,
        this.product.stocked_quantity
      );
    }
  }

  shareOnFacebook(event: Event): void {
    event.stopPropagation();

    const productUrl = `${window.location.origin}/product/${this.product._id}`;
    const quote = `Check out this amazing product: ${this.product.product_name}! It's available for just ${this.product.unit_price.toLocaleString()} VND.`;
    const hashtag = '#AmazingProduct #ĐẶC SẢN 3 MIỀN #BeĐẶC SẢN 3 MIỀN';

    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(quote)}&hashtag=${encodeURIComponent(hashtag)}`;

    window.open(url, '_blank');
  }

  getOriginalPrice(): number | null {
    if (this.product.discount && this.product.discount > 0) {
      const originalPrice = this.product.unit_price / (1 - this.product.discount);
      return Math.round(originalPrice / 1000) * 1000;
    }
    return null;
  }

  getImageSrc(): string {
    return this.productService.resolveProductImageSrc(this.product?.image_1, this.product?._id || '');
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private syncLikedState(): void {
    if (!this.isLoggedIn() || !this.product?._id) {
      this.isLiked = false;
      return;
    }

    this.isLiked = this.authService.getLikedProducts().includes(this.product._id);
  }
}
