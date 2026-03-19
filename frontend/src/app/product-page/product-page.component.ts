import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css']
})
export class ProductPageComponent implements OnInit {
  product: Product | undefined;
  errorMessage: string = '';
  reviewCount: number = 0;
  averageRating: number = 0;
  showRelatedProducts: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductAPIService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      distinctUntilChanged()
    ).subscribe(productId => {
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(productId: string): void {
    this.product = this.productService.getWarmProductById(productId) || undefined;
    this.errorMessage = '';
    this.reviewCount = 0;
    this.averageRating = 0;
    this.showRelatedProducts = false;

    this.productService.getProductById(productId).subscribe({
      next: (data) => {
        this.product = data;
        setTimeout(() => {
          this.loadReviewStats(productId);
        }, 100);
        setTimeout(() => {
          this.showRelatedProducts = true;
        }, 250);
      },
      error: (err) => {
        this.errorMessage = "Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau.";
      }
    });
  }

  loadReviewStats(productId: string): void {
    this.productService.getProductReviews(productId, 1, 1).subscribe({
      next: (data) => {
        this.reviewCount = data.total;
        this.averageRating = data.averageRating;
      },
      error: () => { this.reviewCount = 0; this.averageRating = 0; }
    });
  }

  onReviewAdded(): void {
    if (this.product?._id) {
      this.loadReviewStats(this.product._id);
    }
  }
}
