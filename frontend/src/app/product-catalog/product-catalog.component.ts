import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../interface/Product';
import { ProductAPIService, ProductQueryOptions } from '../product-api.service';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css']
})
export class ProductCatalogComponent implements OnInit {
  categories: { name: string; image: string; filterKey: string }[] = [];
  selectedCategory = 'Tất cả';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  productCount = 0;
  isLoading = true;
  errMessage = '';
  priceFilter = '';
  tagFilter = '';
  provinceFilter = '';
  searchQuery = '';
  ratingFilter = '';
  promoNew = false;
  promoBestSeller = false;
  promoDiscount = false;
  availabilityFilter = '';
  priceMinRange = 0;
  priceMaxRange = 5000000;
  priceMinValue = 0;
  priceMaxValue = 5000000;

  currentPage = 1;
  itemsPerPage = 36;
  totalPages = 0;
  totalItems = 0;

  provinces: string[] = [];
  filteredProvinces: string[] = [];
  provinceCounts: Record<string, number> = {};
  provinceSearchQuery = '';
  showProvinceSuggestions = false;

  private hasAppliedRouteParams = false;

  get priceRangeStep(): number {
    const range = this.priceMaxRange - this.priceMinRange;
    if (range <= 0) return 1000;
    if (range <= 500000) return 10000;
    if (range <= 5000000) return 50000;
    return 100000;
  }

  constructor(
    private productService: ProductAPIService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeCategories();
    this.loadCatalogMeta();
    this.route.queryParams.subscribe((params) => {
      this.searchQuery = params['search'] || '';
      this.provinceFilter = params['province'] || '';
      this.provinceSearchQuery = this.provinceFilter;
      this.selectedCategory = this.mapCategoryTypeToName(params['category'] || '');
      this.promoDiscount = params['discount'] === 'true';
      this.currentPage = 1;
      this.hasAppliedRouteParams = true;

      if (this.provinces.length > 0) {
        this.fetchProducts();
      }
    });
  }

  initializeCategories(): void {
    this.categories = [
      { name: 'Tất cả', image: '/assets/Mẫu.jpg', filterKey: 'Tất cả' },
      { name: 'Nến', image: '/assets/Mẫu.jpg', filterKey: 'Nến' },
      { name: 'Tre mây', image: '/assets/Mẫu.jpg', filterKey: 'Tre mây' },
      { name: 'Gốm sứ', image: '/assets/Mẫu.jpg', filterKey: 'Gốm sứ' },
    ];
  }

  loadCatalogMeta(): void {
    this.productService.getCatalogMeta().subscribe({
      next: (meta) => {
        this.provinces = meta.provinces;
        this.filteredProvinces = [...meta.provinces];
        this.provinceCounts = meta.provinceCounts || {};
        this.priceMinRange = meta.minPrice ?? 0;
        this.priceMaxRange = meta.maxPrice ?? 5000000;
        this.priceMinValue = this.priceMinRange;
        this.priceMaxValue = this.priceMaxRange;

        if (!this.hasAppliedRouteParams) {
          this.fetchProducts();
          return;
        }

        this.fetchProducts();
      },
      error: () => {
        this.errMessage = 'Failed to load catalog metadata. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  loadProducts(): void {
    this.currentPage = 1;
    this.fetchProducts();
  }

  applyFilter(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;
    this.fetchProducts();
  }

  applySearchFilter(searchTerm: string): void {
    this.searchQuery = searchTerm;
    this.currentPage = 1;
    this.fetchProducts();
  }

  filterByPrice(value: string | Event): void {
    this.priceFilter = typeof value === 'string' ? value : (value.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.fetchProducts();
  }

  filterByTag(value: string | Event): void {
    this.tagFilter = typeof value === 'string' ? value : (value.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.fetchProducts();
  }

  filterByProvince(event: Event): void {
    this.provinceFilter = (event.target as HTMLSelectElement).value;
    this.provinceSearchQuery = this.provinceFilter;
    this.currentPage = 1;
    this.fetchProducts();
  }

  applyProvinceFilter(): void {
    this.currentPage = 1;
    this.fetchProducts();
  }

  onProvinceSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.provinceSearchQuery = query;

    if (!query) {
      this.filteredProvinces = [...this.provinces];
      if (this.provinceFilter) {
        this.clearProvinceFilter();
      }
    } else {
      this.filteredProvinces = this.provinces.filter((province) =>
        province.toLowerCase().includes(query)
      );
    }

    this.showProvinceSuggestions = true;
  }

  selectProvince(province: string): void {
    this.provinceFilter = province;
    this.provinceSearchQuery = province;
    this.showProvinceSuggestions = false;
    this.currentPage = 1;
    this.fetchProducts();
  }

  clearProvinceFilter(): void {
    this.provinceFilter = '';
    this.provinceSearchQuery = '';
    this.filteredProvinces = [...this.provinces];
    this.showProvinceSuggestions = false;
    this.currentPage = 1;
    this.fetchProducts();
  }

  onProvinceInputBlur(): void {
    setTimeout(() => {
      this.showProvinceSuggestions = false;
    }, 200);
  }

  getProvinceProductCount(province: string): number {
    return this.provinceCounts[province] || 0;
  }

  clearAllFilters(): void {
    this.provinceFilter = '';
    this.provinceSearchQuery = '';
    this.tagFilter = '';
    this.priceFilter = '';
    this.priceMinValue = this.priceMinRange;
    this.priceMaxValue = this.priceMaxRange;
    this.ratingFilter = '';
    this.promoNew = false;
    this.promoBestSeller = false;
    this.promoDiscount = false;
    this.availabilityFilter = '';
    this.searchQuery = '';
    this.selectedCategory = 'Tất cả';
    this.currentPage = 1;
    this.fetchProducts();
  }

  getActiveFilters(): { key: string; label: string }[] {
    const list: { key: string; label: string }[] = [];
    if (this.selectedCategory && this.selectedCategory !== 'Tất cả') {
      list.push({ key: 'category', label: this.selectedCategory });
    }
    if (this.priceFilter === 'lowToHigh') list.push({ key: 'price', label: 'Giá: Thấp → Cao' });
    if (this.priceFilter === 'highToLow') list.push({ key: 'price', label: 'Giá: Cao → Thấp' });
    const hasPriceRange = this.hasCustomPriceRange();
    if (hasPriceRange) {
      list.push({ key: 'priceRange', label: this.formatPrice(this.priceMinValue) + ' - ' + this.formatPrice(this.priceMaxValue) });
    }
    if (this.tagFilter === 'new') list.push({ key: 'tag', label: 'Mới' });
    if (this.tagFilter === 'discount') list.push({ key: 'tag', label: 'Giảm giá' });
    if (this.promoNew) list.push({ key: 'promoNew', label: 'Sản phẩm mới' });
    if (this.promoBestSeller) list.push({ key: 'promoBestSeller', label: 'Đánh giá cao' });
    if (this.promoDiscount) list.push({ key: 'promoDiscount', label: 'Đang giảm giá' });
    if (this.ratingFilter) list.push({ key: 'rating', label: this.ratingFilter + ' sao trở lên' });
    if (this.availabilityFilter === 'inStock') list.push({ key: 'availability', label: 'Còn hàng' });
    if (this.availabilityFilter === 'outOfStock') list.push({ key: 'availability', label: 'Hết hàng' });
    if (this.provinceFilter) list.push({ key: 'province', label: this.provinceFilter });
    if (this.searchQuery) list.push({ key: 'search', label: this.searchQuery });
    return list;
  }

  removeFilter(key: string): void {
    this.currentPage = 1;
    if (key === 'category') this.selectedCategory = 'Tất cả';
    if (key === 'price') this.priceFilter = '';
    if (key === 'priceRange') {
      this.priceMinValue = this.priceMinRange;
      this.priceMaxValue = this.priceMaxRange;
    }
    if (key === 'tag') this.tagFilter = '';
    if (key === 'promoNew') this.promoNew = false;
    if (key === 'promoBestSeller') this.promoBestSeller = false;
    if (key === 'promoDiscount') this.promoDiscount = false;
    if (key === 'rating') this.ratingFilter = '';
    if (key === 'availability') this.availabilityFilter = '';
    if (key === 'province') {
      this.provinceFilter = '';
      this.provinceSearchQuery = '';
    }
    if (key === 'search') this.searchQuery = '';
    this.fetchProducts();
  }

  onPromoChange(): void {
    this.currentPage = 1;
    this.fetchProducts();
  }

  onRatingFilterChange(value: string): void {
    this.ratingFilter = value;
    this.currentPage = 1;
    this.fetchProducts();
  }

  onAvailabilityChange(value: string): void {
    this.availabilityFilter = value;
    this.currentPage = 1;
    this.fetchProducts();
  }

  onPriceRangeChange(): void {
    if (this.priceMinValue > this.priceMaxValue) {
      const temp = this.priceMinValue;
      this.priceMinValue = this.priceMaxValue;
      this.priceMaxValue = temp;
    }
    this.currentPage = 1;
    this.fetchProducts();
  }

  formatPrice(v: number): string {
    if (v >= 1e6) return (v / 1e6).toFixed(0) + ' tr';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
    return v + '₫';
  }

  applyCategoryFilter(categoryType: string): void {
    this.selectedCategory = this.mapCategoryTypeToName(categoryType);
    this.currentPage = 1;
    this.fetchProducts();
  }

  applyDiscountFilter(): void {
    this.selectedCategory = 'Tất cả';
    this.promoDiscount = true;
    this.currentPage = 1;
    this.fetchProducts();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchProducts(true);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchProducts(true);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchProducts(true);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }
    return pages;
  }

  getEndRange(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  trackByProductId(_index: number, product: Product): string {
    return product._id;
  }

  trackByText(_index: number, value: string): string {
    return value;
  }

  trackByCategory(_index: number, category: { name: string; image: string; filterKey: string }): string {
    return category.filterKey;
  }

  trackByNumber(_index: number, value: number): number {
    return value;
  }

  trackByFilter(_index: number, filter: { key: string; label: string }): string {
    return `${filter.key}:${filter.label}`;
  }

  private fetchProducts(shouldScroll = false): void {
    this.isLoading = true;
    this.errMessage = '';

    this.productService.getProducts(
      this.currentPage,
      this.itemsPerPage,
      this.provinceFilter,
      this.mapCategoryNameToType(this.selectedCategory),
      'none',
      this.buildQueryOptions()
    ).subscribe({
      next: (data) => {
        const mappedProducts = data.products.map((product) => this.productService.mapToProduct(product));
        this.products = mappedProducts;
        this.filteredProducts = mappedProducts;
        this.paginatedProducts = mappedProducts;
        this.productCount = data.total;
        this.totalItems = data.total;
        this.totalPages = data.pages;
        this.errMessage = mappedProducts.length === 0 ? 'No products found in this category.' : '';
        this.isLoading = false;

        if (shouldScroll) {
          this.scrollToTop();
        }
      },
      error: () => {
        this.products = [];
        this.filteredProducts = [];
        this.paginatedProducts = [];
        this.productCount = 0;
        this.totalItems = 0;
        this.totalPages = 0;
        this.errMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private hasCustomPriceRange(): boolean {
    return this.priceMaxRange > this.priceMinRange &&
      (this.priceMinValue > this.priceMinRange || this.priceMaxValue < this.priceMaxRange);
  }

  private buildQueryOptions(): ProductQueryOptions {
    const options: ProductQueryOptions = {};
    const minRating = this.getEffectiveMinRating();

    if (this.searchQuery.trim()) {
      options.search = this.searchQuery.trim();
    }
    if (this.hasCustomPriceRange()) {
      options.minPrice = this.priceMinValue;
      options.maxPrice = this.priceMaxValue;
    }
    if (minRating !== undefined) {
      options.minRating = minRating;
    }
    if (this.tagFilter === 'discount' || this.promoDiscount) {
      options.discount = true;
    }
    if (this.tagFilter === 'new' || this.promoNew) {
      options.isNew = true;
    }
    if (this.availabilityFilter === 'inStock') {
      options.inStock = true;
    }
    if (this.availabilityFilter === 'outOfStock') {
      options.inStock = false;
    }
    if (this.priceFilter === 'lowToHigh') {
      options.sort = 'price_asc';
    } else if (this.priceFilter === 'highToLow') {
      options.sort = 'price_desc';
    } else if (this.promoBestSeller) {
      options.sort = 'rating_desc';
    }

    return options;
  }

  private getEffectiveMinRating(): number | undefined {
    const ratingFromFilter = this.ratingFilter ? Number(this.ratingFilter) : 0;
    const ratingFromPromo = this.promoBestSeller ? 4 : 0;
    const minRating = Math.max(ratingFromFilter, ratingFromPromo);
    return minRating > 0 ? minRating : undefined;
  }

  private mapCategoryNameToType(category: string): string {
    const categoryToTypeMap: Record<string, string> = {
      'Nến': 'nen',
      'Tre mây': 'tre_may',
      'Gốm sứ': 'gom_su'
    };
    return categoryToTypeMap[category] || '';
  }

  private mapCategoryTypeToName(categoryType: string): string {
    const categoryTypeMap: Record<string, string> = {
      'nen': 'Nến',
      'tre_may': 'Tre mây',
      'gom_su': 'Gốm sứ'
    };
    return categoryTypeMap[categoryType] || 'Tất cả';
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
