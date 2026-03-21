import { Component, OnInit } from '@angular/core';
import { Product } from '../../interface/Product';
import { ProductAPIService } from '../product-api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css']
})
export class ProductCatalogComponent implements OnInit {
  categories: { name: string; image: string; filterKey: string }[] = [];
  selectedCategory: string = 'Tất cả';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  productCount: number = 0;
  isLoading: boolean = true;
  errMessage: string = '';
  priceFilter: string = '';
  tagFilter: string = '';
  provinceFilter: string = '';
  searchQuery: string = '';
  ratingFilter: string = '';
  promoNew: boolean = false;
  promoBestSeller: boolean = false;
  promoDiscount: boolean = false;
  availabilityFilter: string = '';
  /** Khoảng giá (thanh kéo) - đơn vị VND, 0 đến 5 triệu */
  priceMinRange: number = 0;
  priceMaxRange: number = 5000000;
  priceMinValue: number = 0;
  priceMaxValue: number = 5000000;
  get priceRangeStep(): number {
    const range = this.priceMaxRange - this.priceMinRange;
    if (range <= 0) return 1000;
    if (range <= 500000) return 10000;
    if (range <= 5000000) return 50000;
    return 100000;
  }
  
  // Pagination: 1 trang = 5 hàng sản phẩm (grid 3 cột → 15 sản phẩm/trang)
  readonly rowsPerPage: number = 5;
  readonly colsPerRow: number = 3;
  get itemsPerPage(): number {
    return this.rowsPerPage * this.colsPerRow;
  }
  currentPage: number = 1;
  totalPages: number = 0;
  totalItems: number = 0;
  
  // Province list
  provinces: string[] = [];
  filteredProvinces: string[] = [];
  provinceSearchQuery: string = '';
  showProvinceSuggestions: boolean = false;

  constructor(
    private productService: ProductAPIService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initializeCategories();
    this.loadProducts();
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      const provinceParam = params['province'] || '';
      const categoryParam = params['category'] || '';
      const discountParam = params['discount'] || '';
      
      if (this.searchQuery) {
        this.applySearchFilter(this.searchQuery);
      }
      
      if (provinceParam) {
        this.provinceFilter = provinceParam;
        console.log('🏛️ Auto-filtering by province:', this.provinceFilter);
      }
      
      if (categoryParam) {
        this.applyCategoryFilter(categoryParam);
        console.log('🏷️ Auto-filtering by category:', categoryParam);
      }
      
      if (discountParam === 'true') {
        this.promoDiscount = true;
        this.applyFilter(this.selectedCategory);
        console.log('💰 Auto-filtering by discount products');
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

  loadProducts(): void {
    this.isLoading = true;
    // Use cached list so when navigating back from product page
    // the catalog appears instantly without re-fetching.
    this.productService.getProductsCachedForCatalog(100).subscribe({
      next: (data) => {
        console.log('🔍 API Response Debug:', {
          totalProducts: data.products.length,
          total: data.total,
          page: data.page,
          pages: data.pages
        });
        
        this.products = data.products.map(productData => new Product(
          productData._id,
          productData.product_name,
          productData.product_detail,
          productData.stocked_quantity,
          productData.unit_price,
          productData.discount,
          productData.createdAt,
          productData.image_1,
          productData.image_2,
          productData.image_3,
          productData.image_4,
          productData.image_5,
          productData.product_dept,
          productData.rating,
          productData.isNew,
          productData.type || 'food'
        ));

        console.log('📦 Products after mapping:', this.products.length);
        this.products.forEach(product => product.checkIfNew());
        
        // Extract unique provinces
        this.provinces = [...new Set(this.products.map(p => p.product_dept).filter(dept => dept && dept.trim()))].sort();
        this.filteredProvinces = [...this.provinces];
        console.log('🏛️ Available provinces:', this.provinces);
        this.priceMinRange = 0;
        this.priceMaxRange = 5000000;
        if (this.priceMinValue === 0 && this.priceMaxValue === 0) {
          this.priceMinValue = 0;
          this.priceMaxValue = 5000000;
        }
        this.applyFilter(this.selectedCategory);
        if (this.searchQuery) {
          this.applySearchFilter(this.searchQuery);
        }
        
        // Apply province filter if set from query params
        if (this.provinceFilter) {
          this.applyProvinceFilter();
        }
        
        this.isLoading = false;
      },
      error: () => {
        this.errMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  applyFilter(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1; // Reset to first page when changing category
    
    if (category === 'Tất cả') {
      this.filteredProducts = [...this.products];
    } else {
      // Map category names to type values
      const categoryToTypeMap: { [key: string]: string } = {
        'Nến': 'nen',
        'Tre mây': 'tre_may',
        'Gốm sứ': 'gom_su'
      };
      
      const typeFilter = categoryToTypeMap[category];
      this.filteredProducts = this.products.filter(product => 
        product.type === typeFilter || product.product_dept === category
      );
    }

    // Apply province filter if selected
    if (this.provinceFilter) {
      this.filteredProducts = this.filteredProducts.filter(product => 
        product.product_dept === this.provinceFilter
      );
    }

    this.applyAdditionalFilters();
    this.updateProductCount();
  }

  applySearchFilter(searchTerm: string): void {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.product_name.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.product_detail.toLowerCase().includes(lowerCaseSearchTerm)
    );
    this.currentPage = 1; // Reset to first page when searching
    this.updateProductCount();
  }

  filterByPrice(value: string | Event): void {
    this.priceFilter = typeof value === 'string' ? value : (value.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.applyAdditionalFilters();
    this.updateProductCount();
  }

  filterByTag(value: string | Event): void {
    this.tagFilter = typeof value === 'string' ? value : (value.target as HTMLSelectElement).value;
    this.currentPage = 1;
    if (this.tagFilter === '') {
      this.provinceFilter = '';
      this.provinceSearchQuery = '';
    }
    this.applyFilter(this.selectedCategory);
  }

  filterByProvince(event: Event): void {
    this.provinceFilter = (event.target as HTMLSelectElement).value;
    this.currentPage = 1; // Reset to first page when filtering
    this.applyFilter(this.selectedCategory);
    
    // Apply province filter after category filter
    if (this.provinceFilter) {
      this.applyProvinceFilter();
    }
  }

  private applyAdditionalFilters(skipTag = false): void {
    if (!skipTag) {
      if (this.tagFilter) {
        this.filteredProducts = this.filteredProducts.filter(product =>
          this.tagFilter === 'new' ? product.isNew : this.tagFilter === 'discount' ? product.discount > 0 : true
        );
      }
      const hasPromo = this.promoNew || this.promoBestSeller || this.promoDiscount;
      if (hasPromo) {
        this.filteredProducts = this.filteredProducts.filter(product => {
          if (this.promoNew && product.isNew) return true;
          if (this.promoBestSeller && product.rating >= 4) return true;
          if (this.promoDiscount && product.discount > 0) return true;
          return false;
        });
      }
      if (this.ratingFilter) {
        const min = parseFloat(this.ratingFilter);
        this.filteredProducts = this.filteredProducts.filter(p => (p.rating || 0) >= min);
      }
      if (this.availabilityFilter === 'inStock') {
        this.filteredProducts = this.filteredProducts.filter(p => (p.stocked_quantity || 0) > 0);
      } else if (this.availabilityFilter === 'outOfStock') {
        this.filteredProducts = this.filteredProducts.filter(p => (p.stocked_quantity || 0) <= 0);
      }
      const usePriceRange = this.priceMinRange < this.priceMaxRange &&
        (this.priceMinValue > this.priceMinRange || this.priceMaxValue < this.priceMaxRange);
      if (usePriceRange) {
        this.filteredProducts = this.filteredProducts.filter(p => {
          const price = p.unit_price ?? 0;
          return price >= this.priceMinValue && price <= this.priceMaxValue;
        });
      }
    }
    if (this.priceFilter) {
      this.filteredProducts.sort((a, b) =>
        this.priceFilter === 'lowToHigh' ? a.unit_price - b.unit_price : b.unit_price - a.unit_price
      );
    }
  }

  applyProvinceFilter(): void {
    if (this.provinceFilter) {
      this.filteredProducts = this.filteredProducts.filter(product => 
        product.product_dept === this.provinceFilter
      );
      console.log('🏛️ Filtered by province:', this.provinceFilter, 'Products:', this.filteredProducts.length);
    }
    this.updateProductCount();
  }

  onProvinceSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.provinceSearchQuery = query;
    
    if (query.length === 0) {
      this.filteredProvinces = [...this.provinces];
      // Clear province filter when input is empty
      if (this.provinceFilter) {
        this.clearProvinceFilter();
      }
    } else {
      this.filteredProvinces = this.provinces.filter(province => 
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
    this.applyFilter(this.selectedCategory);
    
    if (this.provinceFilter) {
      this.applyProvinceFilter();
    }
  }

  clearProvinceFilter(): void {
    this.provinceFilter = '';
    this.provinceSearchQuery = '';
    this.showProvinceSuggestions = false;
    this.currentPage = 1;
    this.applyFilter(this.selectedCategory);
  }

  onProvinceInputBlur(): void {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      this.showProvinceSuggestions = false;
    }, 200);
  }

  getProvinceProductCount(province: string): number {
    return this.products.filter(product => product.product_dept === province).length;
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
    this.applyFilter('Tất cả');
  }

  getActiveFilters(): { key: string; label: string }[] {
    const list: { key: string; label: string }[] = [];
    if (this.selectedCategory && this.selectedCategory !== 'Tất cả') {
      list.push({ key: 'category', label: this.selectedCategory });
    }
    if (this.priceFilter === 'lowToHigh') list.push({ key: 'price', label: 'Giá: Thấp → Cao' });
    if (this.priceFilter === 'highToLow') list.push({ key: 'price', label: 'Giá: Cao → Thấp' });
    const hasPriceRange = this.priceMaxRange > this.priceMinRange &&
      (this.priceMinValue > this.priceMinRange || this.priceMaxValue < this.priceMaxRange);
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
    return list;
  }

  removeFilter(key: string): void {
    this.currentPage = 1;
    if (key === 'category') {
      this.selectedCategory = 'Tất cả';
      this.applyFilter('Tất cả');
    } else if (key === 'price') {
      this.priceFilter = '';
      this.applyFilter(this.selectedCategory);
    } else if (key === 'priceRange') {
      this.priceMinValue = this.priceMinRange;
      this.priceMaxValue = this.priceMaxRange;
      this.applyFilter(this.selectedCategory);
    } else if (key === 'tag') {
      this.tagFilter = '';
      this.applyFilter(this.selectedCategory);
    } else if (key === 'promoNew') {
      this.promoNew = false;
      this.applyFilter(this.selectedCategory);
    } else if (key === 'promoBestSeller') {
      this.promoBestSeller = false;
      this.applyFilter(this.selectedCategory);
    } else if (key === 'promoDiscount') {
      this.promoDiscount = false;
      this.applyFilter(this.selectedCategory);
    } else if (key === 'rating') {
      this.ratingFilter = '';
      this.applyFilter(this.selectedCategory);
    } else if (key === 'availability') {
      this.availabilityFilter = '';
      this.applyFilter(this.selectedCategory);
    } else if (key === 'province') {
      this.clearProvinceFilter();
    }
  }

  onPromoChange(): void {
    this.currentPage = 1;
    this.applyFilter(this.selectedCategory);
  }

  onRatingFilterChange(value: string): void {
    this.ratingFilter = value;
    this.currentPage = 1;
    this.applyFilter(this.selectedCategory);
  }

  onAvailabilityChange(value: string): void {
    this.availabilityFilter = value;
    this.currentPage = 1;
    this.applyFilter(this.selectedCategory);
  }

  onPriceRangeChange(): void {
    if (this.priceMinValue > this.priceMaxValue) {
      const t = this.priceMinValue;
      this.priceMinValue = this.priceMaxValue;
      this.priceMaxValue = t;
    }
    this.currentPage = 1;
    this.applyFilter(this.selectedCategory);
  }

  formatPrice(v: number): string {
    if (v >= 1e6) return (v / 1e6).toFixed(0) + ' tr';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k';
    return v + '₫';
  }

  applyCategoryFilter(categoryType: string): void {
    // Map category types to category names
    const categoryTypeMap: { [key: string]: string } = {
      'nen': 'Nến',
      'tre_may': 'Tre mây',
      'gom_su': 'Gốm sứ'
    };
    
    const categoryName = categoryTypeMap[categoryType] || 'Tất cả';
    this.selectedCategory = categoryName;
    this.currentPage = 1;
    this.applyFilter(categoryName);
  }

  applyDiscountFilter(): void {
    this.selectedCategory = 'Tất cả';
    this.currentPage = 1;
    
    // Filter products with discount > 0
    this.filteredProducts = this.products.filter(product => product.discount > 0);
    
    this.applyAdditionalFilters();
    this.updateProductCount();
  }

  private updateProductCount(): void {
    this.productCount = this.filteredProducts.length;
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Only reset to first page if current page is beyond total pages
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedProducts();
    this.errMessage = this.filteredProducts.length === 0
      ? 'No products found in this category.'
      : '';
  }

  private updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
    
    // Debug info
    console.log('Pagination Debug:', {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      filteredProductsLength: this.filteredProducts.length,
      paginatedProductsLength: this.paginatedProducts.length,
      startIndex,
      endIndex
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
      this.scrollToTop();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedProducts();
      this.scrollToTop();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedProducts();
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getEndRange(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
