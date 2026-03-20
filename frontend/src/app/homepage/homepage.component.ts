import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';

const HERO_AUTO_CHANGE_MS = 6000;

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit, OnDestroy {
  showScrollButton: boolean = false;
  currentHeroIndex = 0;
  heroAutoTimer: any;
  featuredProducts: Product[] = [];
  isProductsLoading = false;
  heroImages = [
    { src: 'assets/New web images/ss_2624665379.jpg', alt: 'Pottery craftsmanship' },
    { src: 'assets/banner-weaving.png', alt: 'Traditional weaving craftsmanship' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductAPIService
  ) { }

  ngOnInit(): void {
    this.route.fragment.subscribe();
    this.startHeroAutoChange();
    this.loadFeaturedProducts();
  }

  startHeroAutoChange(): void {
    this.heroAutoTimer = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroImages.length;
    }, HERO_AUTO_CHANGE_MS);
  }

  goToHeroSlide(index: number): void {
    this.currentHeroIndex = index;
    clearInterval(this.heroAutoTimer);
    this.startHeroAutoChange();
  }

  ngOnDestroy(): void {
    clearInterval(this.heroAutoTimer);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollButton = window.pageYOffset > 700;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 680, behavior: 'smooth' });
  }

  goToDiscountProducts(): void {
    this.router.navigate(['/catalog'], { queryParams: { discount: 'true' } });
  }

  loadFeaturedProducts(): void {
    this.isProductsLoading = true;
    this.productService.getProducts(1, 8).subscribe({
      next: (data) => {
        this.featuredProducts = data.products.map((productData) => this.productService.mapToProduct(productData));
        this.productService.prefetchImageUrls(
          this.featuredProducts.map((product) => this.getProductImage(product)),
          { highPriority: true, limit: 4 }
        );
        this.isProductsLoading = false;
      },
      error: () => {
        this.featuredProducts = [];
        this.isProductsLoading = false;
      }
    });
  }

  getProductRows(): Product[][] {
    const rows: Product[][] = [];
    for (let i = 0; i < this.featuredProducts.length; i += 4) {
      rows.push(this.featuredProducts.slice(i, i + 4));
    }
    return rows;
  }

  goToProduct(productId: string): void {
    if (!productId) {
      return;
    }
    this.router.navigate(['/product', productId]);
  }

  getProductImage(product: Product): string {
    return this.productService.resolveProductImageSrc(product?.image_1, product?._id || '');
  }

  trackByRowIndex(index: number): number {
    return index;
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id;
  }
}
