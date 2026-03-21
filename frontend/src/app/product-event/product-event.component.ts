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
    this._service.getProducts(1, 100).subscribe({
      next: (data) => {
        this.discountedProducts = data.products.filter(product => product.discount >= 0.3).slice(0, 6);
        this.isLoading = false;
      },
      error: (err) => {
        this.errMessage = "Failed to load products. Please try again later.";
        this.isLoading = false;
      }
    });
  }
}
