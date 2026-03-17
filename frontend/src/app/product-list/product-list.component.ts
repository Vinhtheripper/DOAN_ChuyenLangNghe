import { Component, OnInit } from '@angular/core';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  displayedProducts: Product[] = [];
  errMessage: string = '';
  isLoading: boolean = true;
  initialDisplayCount: number = 8;
  loadMoreCount: number = 8;

  constructor(
    private _service: ProductAPIService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this._service.getProducts(1, 24).subscribe({
      next: (data) => {
        this.products = data.products.map(product => this._service.mapToProduct(product));
        this.displayedProducts = this.products.slice(0, this.initialDisplayCount);
        this.isLoading = false;
      },
      error: (err) => {
        this.errMessage = "Failed to load products. Please try again later.";
        this.isLoading = false;
      }
    });
  }

  showMore(): void {
    const currentLength = this.displayedProducts.length;
    const additionalProducts = this.products.slice(currentLength, currentLength + this.loadMoreCount);
    this.displayedProducts = [...this.displayedProducts, ...additionalProducts];
  }

  goToAllProducts(): void {
    this.router.navigate(['/catalog']);
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id;
  }
}
