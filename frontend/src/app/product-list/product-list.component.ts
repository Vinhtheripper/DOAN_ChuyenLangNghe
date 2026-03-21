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
    this._service.getProducts(1, 100).subscribe({
      next: (data) => {
        this.products = data.products.map(product => {
          const newProduct = new Product(
            product._id || '',
            product.product_name || '',
            product.product_detail || '',
            product.stocked_quantity || 0,
            product.unit_price || 0,
            product.discount || 0,
            product.createdAt || '',
            product.image_1 || '',
            product.image_2 || '',
            product.image_3 || '',
            product.image_4 || '',
            product.image_5 || '',
            product.product_dept || '',
            product.rating || 0,
            product.isNew || false,
            product.type || 'food'
          );
          newProduct.checkIfNew();
          return newProduct;
        });
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
}
