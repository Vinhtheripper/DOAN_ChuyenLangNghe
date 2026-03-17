import { Component, OnInit } from '@angular/core';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';

@Component({
  selector: 'app-product-event',
  templateUrl: './product-event.component.html',
  styleUrls: ['./product-event.component.css']
})
export class ProductEventComponent implements OnInit {
  discountedProducts: Product[] = [];
  errMessage: string = '';
  isLoading: boolean = true;

  constructor(private _service: ProductAPIService) { }

  ngOnInit(): void {
    this._service.getProducts(1, 24).subscribe({
      next: (data) => {
        this.discountedProducts = data.products
          .filter(product => product.discount >= 0.3)
          .slice(0, 6)
          .map(product => {
            const mappedProduct = new Product(
              product._id || '',
              product.product_name || '',
              product.product_detail || '',
              product.stocked_quantity || 0,
              product.unit_price || 0,
              product.discount || 0,
              product.createdAt || '',
              this._service.resolveProductImageSrc(product.image_1, product._id || ''),
              product.image_2 || '',
              product.image_3 || '',
              product.image_4 || '',
              product.image_5 || '',
              product.product_dept || '',
              product.rating || 0,
              product.isNew || false,
              product.type || 'food'
            );
            mappedProduct.checkIfNew();
            return mappedProduct;
          });
        this.isLoading = false;
      },
      error: (err) => {
        this.errMessage = "Failed to load products. Please try again later.";
        this.isLoading = false;
      }
    });
  }
}
