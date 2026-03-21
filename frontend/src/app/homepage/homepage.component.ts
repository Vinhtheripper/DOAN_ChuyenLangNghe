import { Component, HostListener, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../interface/Product';
import { ProductAPIService } from '../product-api.service';

const HERO_AUTO_CHANGE_MS = 6000;

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit, OnDestroy, AfterViewInit {
  showScrollButton: boolean = false;
  currentHeroIndex = 0;
  heroAutoTimer: any;
  featuredProducts: Product[] = [];
  isProductsLoading = false;
  heroImages = [
    { src: 'assets/New web images/ss_2624665379.jpg', alt: 'Pottery craftsmanship' },
    { src: 'assets/banner-weaving.png', alt: 'Traditional weaving craftsmanship' }
  ];

  // Real data sections
  homeProducts: Product[] = [];
  homeNews: { id: string; title: string; desc: string; image: string; date?: string }[] = [];

  // Scroll animation flags
  @ViewChild('seriesSection', { static: false }) seriesSection?: ElementRef<HTMLElement>;
  seriesInView = false;

  /** Reveal-on-scroll: section id -> visible */
  sectionRevealed: Record<string, boolean> = {};
  private revealObserver: IntersectionObserver | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductAPIService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.fragment.subscribe();
    this.startHeroAutoChange();
    this.loadHomeProducts();
    this.loadHomeNews();
  }

  ngAfterViewInit(): void {
    this.setupRevealObserver();
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
    this.revealObserver?.disconnect();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollButton = window.pageYOffset > 700;
    this.checkSeriesInView();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 680, behavior: 'smooth' });
  }

  private checkSeriesInView(): void {
    if (!this.seriesSection || this.seriesInView) {
      return;
    }
    const el = this.seriesSection.nativeElement;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Kích hoạt khi phần trên của section chạm khoảng giữa màn hình
    if (rect.top < windowHeight * 0.7 && rect.bottom > windowHeight * 0.2) {
      this.seriesInView = true;
    }
  }

  private setupRevealObserver(): void {
    const rootMargin = '0px 0px -12% 0px'; // trigger when ~12% from bottom of viewport
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).getAttribute('data-reveal-id');
          if (id && entry.isIntersecting) {
            this.sectionRevealed[id] = true;
            if (id === 'series') this.seriesInView = true;
            this.cdr.detectChanges();
          }
        });
      },
      { rootMargin, threshold: 0.05 }
    );
    setTimeout(() => {
      document.querySelectorAll('.js-reveal').forEach((el) => this.revealObserver?.observe(el));
    }, 100);
  }

  goToDiscountProducts(): void {
    this.router.navigate(['/catalog'], { queryParams: { discount: 'true' } });
  }

  private loadHomeProducts(): void {
    this.isProductsLoading = true;
    this.productService.getProductsCachedForCatalog(100).subscribe({
      next: data => {
        const all = (data.products || []).map((p: any) => new Product(
          p._id ?? '',
          p.product_name ?? '',
          p.product_detail ?? '',
          p.stocked_quantity ?? 0,
          p.unit_price ?? 0,
          p.discount ?? 0,
          p.createdAt ?? '',
          p.image_1 ?? '',
          p.image_2 ?? '',
          p.image_3 ?? '',
          p.image_4 ?? '',
          p.image_5 ?? '',
          p.product_dept ?? '',
          p.rating ?? 0,
          p.isNew ?? false,
          p.type || 'food'
        ));
        all.forEach(prod => prod.checkIfNew());
        this.homeProducts = all.slice(0, 8);
        this.isProductsLoading = false;
      },
      error: () => {
        this.homeProducts = [];
        this.isProductsLoading = false;
      }
    });
  }

  private loadHomeNews(): void {
    this.homeNews = [
      {
        id: 'mot-doi-mot-nghe',
        title: 'Một đời - Một nghề',
        desc: 'Có những người dành trọn cả cuộc đời cho một công việc duy nhất – gắn bó với làng, với nghề.',
        image: 'assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png'
      },
      {
        id: 'tro-ve-de-tiep-noi',
        title: 'Trở về để tiếp nối',
        desc: 'Thế hệ trẻ quay về làng nghề, mang theo tri thức mới để nối dài truyền thống.',
        image: 'assets/blog-image-53f5fb1b-b202-4137-9a5c-cd716fba7ee8.png'
      },
      {
        id: 'bat-trang-700-nam',
        title: 'Bát Tràng – 700 năm giữ nghề gốm',
        desc: 'Ngôi làng gốm bên bờ sông Hồng với bề dày lịch sử và di sản sống.',
        image: 'assets/blog-featured-middle.png'
      }
    ];
  }

  viewProductDetail(product: Product): void {
    if (!product._id) { return; }
    this.router.navigate(['/product', product._id]);
  }

  viewNewsDetail(item: { id: string }): void {
    this.router.navigate(['/blog'], { queryParams: { id: item.id } });
  }

  getProductRows(): Product[][] {
    const rows: Product[][] = [];
    for (let i = 0; i < this.homeProducts.length; i += 4) {
      rows.push(this.homeProducts.slice(i, i + 4));
    }
    return rows;
  }
}
