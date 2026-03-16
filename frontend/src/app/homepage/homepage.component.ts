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
        this.featuredProducts = data.products.map((productData) => {
          const product = new Product(
            productData._id || '',
            productData.product_name || '',
            productData.product_detail || '',
            productData.stocked_quantity || 0,
            productData.unit_price || 0,
            productData.discount || 0,
            productData.createdAt || '',
            productData.image_1 || 'assets/Mẫu.jpg',
            productData.image_2 || '',
            productData.image_3 || '',
            productData.image_4 || '',
            productData.image_5 || '',
            productData.product_dept || '',
            productData.rating || 0,
            productData.isNew || false,
            productData.type || 'food'
          );
          product.checkIfNew();
          return product;
        });
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
}
