import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, retry, shareReplay, tap, throwError } from 'rxjs';
import { Product } from '../interface/Product';
import { buildUrl } from './utils/url.util';

@Injectable({
  providedIn: 'root'
})
export class ProductAPIService {
  private apiUrl = buildUrl('/products');
  private token: string | null = null;
  private readonly cacheTtlMs = 60 * 1000;
  private productsCache = new Map<string, { expiresAt: number; request$: Observable<{ products: Product[]; total: number; page: number; pages: number }> }>();
  private productByIdCache = new Map<string, { expiresAt: number; request$: Observable<Product> }>();
  private productListSnapshots = new Map<string, { expiresAt: number; value: { products: Product[]; total: number; page: number; pages: number } }>();
  private catalogMetaCache: {
    expiresAt: number;
    request$: Observable<{ provinces: string[]; provinceCounts: Record<string, number>; minPrice: number; maxPrice: number }>;
  } | null = null;
  private hasPreloadedInitialData = false;
  private warmedRoutes = new Set<string>();
  private prefetchedImageUrls = new Set<string>();

  constructor(private _http: HttpClient) {
    this.token = this.getToken();
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    if (error.status === 0) {
      errorMessage = 'Network error occurred. Please check your connection.';
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request. Please check the data you provided.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in and try again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Requested resource not found.';
          break;
        case 500:
          errorMessage = 'An internal server error occurred. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || 'An unexpected error occurred. Please try again later.';
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  private getCachedRequest<T>(
    cache: Map<string, { expiresAt: number; request$: Observable<T> }>,
    key: string
  ): Observable<T> | null {
    const cached = cache.get(key);
    if (!cached) {
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }
    return cached.request$;
  }

  private setCachedRequest<T>(
    cache: Map<string, { expiresAt: number; request$: Observable<T> }>,
    key: string,
    request$: Observable<T>
  ): Observable<T> {
    cache.set(key, {
      expiresAt: Date.now() + this.cacheTtlMs,
      request$
    });
    return request$;
  }

  private getProductScopeKey(
    dept: string,
    type: string,
    includeImages: 'none' | 'primary' | 'all'
  ): string {
    return JSON.stringify({ dept, type, includeImages });
  }

  private getSnapshotProductList(
    scopeKey: string,
    page: number,
    limit: number
  ): { products: Product[]; total: number; page: number; pages: number } | null {
    if (page !== 1) {
      return null;
    }

    const cached = this.productListSnapshots.get(scopeKey);
    if (!cached) {
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      this.productListSnapshots.delete(scopeKey);
      return null;
    }
    if (cached.value.page !== 1 || cached.value.products.length < limit) {
      return null;
    }

    return {
      products: cached.value.products.slice(0, limit),
      total: cached.value.total,
      page: 1,
      pages: Math.ceil(cached.value.total / limit)
    };
  }

  private setSnapshotProductList(
    scopeKey: string,
    value: { products: Product[]; total: number; page: number; pages: number }
  ): void {
    if (value.page !== 1) {
      return;
    }

    const existing = this.productListSnapshots.get(scopeKey);
    if (existing && existing.expiresAt > Date.now() && existing.value.products.length >= value.products.length) {
      return;
    }

    this.productListSnapshots.set(scopeKey, {
      expiresAt: Date.now() + this.cacheTtlMs,
      value
    });
  }

  getWarmProductById(id: string): Product | null {
    for (const snapshot of this.productListSnapshots.values()) {
      if (snapshot.expiresAt <= Date.now()) {
        continue;
      }

      const matchedProduct = snapshot.value.products.find((product) => product._id === id);
      if (matchedProduct) {
        return matchedProduct;
      }
    }

    return null;
  }

  private clearProductCaches(): void {
    this.productsCache.clear();
    this.productListSnapshots.clear();
    this.catalogMetaCache = null;
    this.warmedRoutes.clear();
  }

  private scheduleWarmRequest(task: () => void): void {
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
    };

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => task());
      return;
    }

    setTimeout(task, 150);
  }

  prefetchImageUrls(urls: string[], options: { highPriority?: boolean; limit?: number } = {}): void {
    const filteredUrls = urls
      .filter((url) => !!url && !this.prefetchedImageUrls.has(url))
      .slice(0, options.limit ?? urls.length);

    if (filteredUrls.length === 0) {
      return;
    }

    const preload = () => {
      filteredUrls.forEach((url) => {
        this.prefetchedImageUrls.add(url);

        if (options.highPriority) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = url;
          document.head.appendChild(link);
          setTimeout(() => link.remove(), 5000);
          return;
        }

        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });
    };

    this.scheduleWarmRequest(preload);
  }

  warmRouteData(routeUrl: string): void {
    const routeKey = routeUrl.split('?')[0];
    if (this.warmedRoutes.has(routeKey)) {
      return;
    }

    this.warmedRoutes.add(routeKey);

    this.scheduleWarmRequest(() => {
      if (routeKey === '/' || routeKey === '') {
        this.getProducts(1, 8).subscribe({
          next: (response) => {
            this.prefetchImageUrls(
              response.products.map((product) => this.getProductThumbnailSrc(product.image_1, product._id || '', { width: 480, height: 480 })),
              { highPriority: true, limit: 4 }
            );
          },
          error: () => undefined
        });
        return;
      }

      if (routeKey.startsWith('/catalog')) {
        this.getCatalogMeta().subscribe({ error: () => undefined });
        this.getProducts(1, 24).subscribe({
          next: (response) => {
            this.prefetchImageUrls(
              response.products.map((product) => this.getProductThumbnailSrc(product.image_1, product._id || '', { width: 480, height: 480 })),
              { limit: 8 }
            );
          },
          error: () => undefined
        });
        return;
      }

      if (routeKey.startsWith('/product/')) {
        const productId = routeKey.split('/').filter(Boolean)[1];
        if (productId) {
          this.getProductById(productId).subscribe({
            next: (product) => {
              this.prefetchImageUrls([
                this.resolveProductImageSrc(product.image_1, product._id || '', 1),
                this.resolveProductImageSrc(product.image_2, product._id || '', 2),
                this.resolveProductImageSrc(product.image_3, product._id || '', 3),
                this.resolveProductImageSrc(product.image_4, product._id || '', 4),
                this.resolveProductImageSrc(product.image_5, product._id || '', 5)
              ], { highPriority: true, limit: 3 });
            },
            error: () => undefined
          });
        }
      }
    });
  }

  mapToProduct(productData: Partial<Product> & { _id?: string }): Product {
    const product = new Product(
      productData._id || '',
      productData.product_name || '',
      productData.product_detail || '',
      productData.stocked_quantity || 0,
      productData.unit_price || 0,
      productData.discount || 0,
      productData.createdAt || '',
      this.resolveProductImageSrc(productData.image_1, productData._id || ''),
      this.resolveProductImageSrc(productData.image_2, productData._id || '', 2),
      this.resolveProductImageSrc(productData.image_3, productData._id || '', 3),
      this.resolveProductImageSrc(productData.image_4, productData._id || '', 4),
      this.resolveProductImageSrc(productData.image_5, productData._id || '', 5),
      productData.product_dept || '',
      productData.rating || 0,
      productData.isNew || false,
      productData.type || 'food'
    );
    product.checkIfNew();
    return product;
  }

  getProductImageUrl(productId: string, slot: number = 1): string {
    return buildUrl(`/products/${productId}/image/${slot}`);
  }

  getProductThumbnailSrc(
    imageValue: string | undefined | null,
    productId: string,
    options: { width?: number; height?: number; fit?: 'crop' | 'clip' | 'max' } = {}
  ): string {
    const originalSrc = this.resolveProductImageSrc(imageValue, productId);
    const handle = this.extractFilestackHandle(originalSrc);

    if (!handle) {
      return originalSrc;
    }

    const width = options.width ?? 480;
    const height = options.height ?? width;
    const fit = options.fit ?? 'crop';

    return `https://cdn.filestackcontent.com/resize=width:${width},height:${height},fit:${fit}/${handle}`;
  }

  private extractFilestackHandle(urlValue: string): string | null {
    try {
      const parsed = new URL(urlValue);
      if (!parsed.hostname.includes('filestackcontent.com')) {
        return null;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length === 0) {
        return null;
      }

      return segments[segments.length - 1];
    } catch {
      return null;
    }
  }

  resolveProductImageSrc(imageValue: string | undefined | null, productId: string, slot: number = 1): string {
    if (!imageValue) {
      return this.getProductImageUrl(productId, slot);
    }

    if (
      imageValue.startsWith('data:image/') ||
      /^https?:\/\//i.test(imageValue)
    ) {
      return imageValue;
    }

    if (imageValue.startsWith('/')) {
      return buildUrl(imageValue);
    }

    if (imageValue.startsWith('assets/')) {
      return buildUrl(`/${imageValue}`);
    }

    return this.getProductImageUrl(productId, slot);
  }

  getProducts(
    page: number = 1,
    limit: number = 10,
    dept: string = '',
    type: string = '',
    includeImages: 'none' | 'primary' | 'all' = 'none',
    options: ProductQueryOptions = {}
  ): Observable<{ products: Product[]; total: number; page: number; pages: number }> {
    const params: any = { page, limit, includeImages };
    if (dept) {
      params.dept = dept;
    }
    if (type) {
      params.type = type;
    }
    if (options.search) {
      params.search = options.search.trim();
    }
    if (options.minPrice !== undefined) {
      params.minPrice = options.minPrice;
    }
    if (options.maxPrice !== undefined) {
      params.maxPrice = options.maxPrice;
    }
    if (options.minRating !== undefined) {
      params.minRating = options.minRating;
    }
    if (options.discount !== undefined) {
      params.discount = options.discount;
    }
    if (options.isNew !== undefined) {
      params.isNew = options.isNew;
    }
    if (options.inStock !== undefined) {
      params.inStock = options.inStock;
    }
    if (options.sort) {
      params.sort = options.sort;
    }

    const hasAdvancedFilters = Object.keys(options).length > 0;
    const scopeKey = this.getProductScopeKey(dept, type, includeImages);
    const snapshot = this.getSnapshotProductList(scopeKey, page, limit);
    if (!hasAdvancedFilters && snapshot) {
      return of(snapshot);
    }

    const cacheKey = JSON.stringify(params);
    const cached = this.getCachedRequest(this.productsCache, cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this._http
      .get<{ products: Product[]; total: number; page: number; pages: number }>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        tap((response) => this.setSnapshotProductList(scopeKey, response)),
        retry(1),
        catchError((error) => {
          this.productsCache.delete(cacheKey);
          return this.handleError(error);
        }),
        shareReplay(1)
      );

    return this.setCachedRequest(this.productsCache, cacheKey, request$);
  }

  getCatalogMeta(): Observable<{ provinces: string[]; provinceCounts: Record<string, number>; minPrice: number; maxPrice: number }> {
    if (this.catalogMetaCache && this.catalogMetaCache.expiresAt > Date.now()) {
      return this.catalogMetaCache.request$;
    }

    const request$ = this._http
      .get<{ provinces: string[]; provinceCounts: Record<string, number>; minPrice: number; maxPrice: number }>(`${this.apiUrl}/meta/catalog`, {
        headers: this.getHeaders()
      })
      .pipe(
        retry(1),
        catchError(this.handleError),
        shareReplay(1)
      );

    this.catalogMetaCache = {
      expiresAt: Date.now() + this.cacheTtlMs,
      request$
    };

    return request$;
  }

  getProductById(id: string): Observable<Product> {
    const cached = this.getCachedRequest(this.productByIdCache, id);
    if (cached) {
      return cached;
    }

    const request$ = this._http
      .get<Product>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      })
      .pipe(
        retry(1),
        catchError((error) => {
          this.productByIdCache.delete(id);
          return this.handleError(error);
        }),
        shareReplay(1)
      );

    return this.setCachedRequest(this.productByIdCache, id, request$);
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this._http
      .get<Product[]>(`${this.apiUrl}?dept=${category}`, {
        headers: this.getHeaders()
      })
      .pipe(retry(1), catchError(this.handleError));
  }

  updateProductStock(id: string, quantity: number): Observable<any> {
    if (typeof quantity !== 'number' || quantity <= 0) {
      return throwError(() => new Error('quantity must be a positive number.'));
    }
    return this._http
      .patch(`${this.apiUrl}/${id}/update-stock`, { quantity }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    if (!product.product_name || typeof product.product_name !== 'string') {
      return throwError(() => new Error('product_name is required and must be a string.'));
    }
    if (typeof product.unit_price !== 'number' || product.unit_price < 0) {
      return throwError(() => new Error('unit_price must be a non-negative number.'));
    }
    if (typeof product.stocked_quantity !== 'number' || product.stocked_quantity < 0) {
      return throwError(() => new Error('stocked_quantity must be a non-negative number.'));
    }
    if (product.discount !== undefined && (product.discount < 0 || product.discount > 1)) {
      return throwError(() => new Error('discount must be between 0 and 1.'));
    }
    if (product.rating !== undefined && (product.rating < 0 || product.rating > 5)) {
      return throwError(() => new Error('rating must be between 0 and 5.'));
    }

    const sanitizedProduct: Record<string, any> = { ...product };

    return this._http
      .post<Product>(this.apiUrl, sanitizedProduct, {
        headers: this.getHeaders()
      })
      .pipe(
        tap(() => this.clearProductCaches()),
        catchError(this.handleError)
      );
  }

  updateProduct(id: string, product: Partial<Product>): Observable<any> {
    if (
      product.product_name !== undefined &&
      (typeof product.product_name !== 'string' || !product.product_name.trim())
    ) {
      return throwError(() => new Error('product_name must be a non-empty string.'));
    }
    if (
      product.unit_price !== undefined &&
      (typeof product.unit_price !== 'number' || product.unit_price < 0)
    ) {
      return throwError(() => new Error('unit_price must be a non-negative number.'));
    }
    if (
      product.stocked_quantity !== undefined &&
      (typeof product.stocked_quantity !== 'number' || product.stocked_quantity < 0)
    ) {
      return throwError(() => new Error('stocked_quantity must be a non-negative number.'));
    }
    if (
      product.discount !== undefined &&
      (product.discount < 0 || product.discount > 1)
    ) {
      return throwError(() => new Error('discount must be between 0 and 1.'));
    }
    if (
      product.rating !== undefined &&
      (product.rating < 0 || product.rating > 5)
    ) {
      return throwError(() => new Error('rating must be between 0 and 5.'));
    }

    const sanitizedProduct: Record<string, any> = { ...product };

    return this._http
      .patch(`${this.apiUrl}/${id}`, sanitizedProduct, {
        headers: this.getHeaders()
      })
      .pipe(
        tap(() => {
          this.clearProductCaches();
          this.productByIdCache.delete(id);
        }),
        catchError(this.handleError)
      );
  }

  deleteProduct(id: string): Observable<any> {
    return this._http
      .delete(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      })
      .pipe(
        tap(() => {
          this.clearProductCaches();
          this.productByIdCache.delete(id);
        }),
        catchError(this.handleError)
      );
  }

  deleteMultipleProducts(ids: string[]): Observable<any> {
    return this._http
      .request('delete', this.apiUrl, {
        headers: this.getHeaders(),
        body: { productIds: ids }
      })
      .pipe(
        tap(() => this.clearProductCaches()),
        catchError(this.handleError)
      );
  }

  preloadInitialData(): void {
    if (this.hasPreloadedInitialData) {
      return;
    }
    this.hasPreloadedInitialData = true;

    this.getProducts(1, 24).subscribe({ error: () => undefined });
    this.getProducts(1, 12, '', 'tre_may').subscribe({ error: () => undefined });
    this.getProducts(1, 12, '', 'gom_su').subscribe({ error: () => undefined });
  }

  /** Get reviews for a product (paginated). */
  getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
    sort: 'newest' | 'oldest' = 'newest'
  ): Observable<{
    reviews: ProductReview[];
    total: number;
    page: number;
    pages: number;
    averageRating: number;
    ratingCounts: { [key: number]: number };
  }> {
    return this._http
      .get<{
        reviews: ProductReview[];
        total: number;
        page: number;
        pages: number;
        averageRating: number;
        ratingCounts: { [key: number]: number };
      }>(`${this.apiUrl}/${productId}/reviews`, {
        headers: this.getHeaders(),
        params: { page: String(page), limit: String(limit), sort },
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }

  /** Submit a review for a product (requires login). */
  submitReview(
    productId: string,
    payload: { rating: number; comment: string; images?: string[] }
  ): Observable<{ message: string }> {
    return this._http
      .post<{ message: string }>(`${this.apiUrl}/${productId}/reviews`, payload, {
        headers: this.getHeaders(),
        withCredentials: true
      })
      .pipe(catchError(this.handleError));
  }
}

export interface ProductReview {
  _id?: string;
  productId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string | Date;
  verified?: boolean;
}

export interface ProductQueryOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  discount?: boolean;
  isNew?: boolean;
  inStock?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc';
}
