import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';

@Component({
  selector: 'app-related-product',
  templateUrl: './related-product.component.html',
  styleUrls: ['./related-product.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RelatedProductComponent implements OnInit {
  @Input() currentProductId: string = '';
  @Input() currentProductDescription: string = '';
  @Input() currentProductDept: string = '';
  relatedProducts: Product[] = [];
  maxRelatedProducts: number = 10;

  constructor(private productService: ProductAPIService) { }

  ngOnInit(): void {
    this.productService.getProducts(1, 100).subscribe((data: { products: Product[]; total: number; page: number; pages: number }) => {
      const otherProducts = data.products.filter(product => product._id && product._id !== this.currentProductId);

      const scoredProducts = otherProducts.map(product => ({
        ...product,
        similarityScore: this.calculateSimilarity(
          this.currentProductDescription,
          product.product_detail,
          this.currentProductDept,
          product.product_dept
        )
      }));

      scoredProducts.sort((a, b) => b.similarityScore - a.similarityScore);

      this.relatedProducts = scoredProducts.slice(0, this.maxRelatedProducts).map(product => {
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
          product.isNew || false
        );
        newProduct.checkIfNew();
        return newProduct;
      });
    });
  }

  calculateSimilarity(desc1: string, desc2: string, dept1: string, dept2: string): number {
    const deptWeight = dept1 === dept2 ? 1 : 0;
    const textWeight = this.calculateTextSimilarity(desc1, desc2);
    return deptWeight * 0.6 + textWeight * 0.4;
  }

  calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    const wordSet = new Set([...words1, ...words2]);
    const vector1 = Array.from(wordSet).map(word => words1.filter(w => w === word).length);
    const vector2 = Array.from(wordSet).map(word => words2.filter(w => w === word).length);
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  tokenize(text: string): string[] {
    const stopWords = new Set(['và', 'hoặc', 'nhưng', 'thì', 'là', 'một', 'cái', 'này', 'kia', 'đó']);
    return text.toLowerCase().split(/\W+/).filter(word => word.length > 0 && !stopWords.has(word));
  }
}
