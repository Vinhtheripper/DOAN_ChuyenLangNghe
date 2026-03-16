import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../interface/Product';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-item',
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.css']
})
export class ProductItemComponent implements OnInit {
  @Input() product!: Product;
  isLiked: boolean = false;
  isLoggedIn: boolean = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (this.isLoggedIn && this.product._id) {
        const likedProducts = this.authService.getLikedProducts();
        this.isLiked = likedProducts.includes(this.product._id);
      }
    });
  }

  goToDetail(): void {
    if (this.product._id) {
      this.router.navigate(['/product', this.product._id]);
    }
  }

  toggleLike(event: Event): void {
    event.stopPropagation();
    if (this.isLoggedIn) {
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
}
