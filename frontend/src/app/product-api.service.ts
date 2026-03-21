import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError, of, tap } from 'rxjs';
import { Product } from '../interface/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductAPIService {
  private apiUrl = '/products';
  private token: string | null = null;

  /** Simple in-memory cache for product list and product details */
  private productsCache: Product[] | null = null;
  private productsCacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private productDetailCache = new Map<string, Product>();

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

  getProducts(
    page: number = 1,
    limit: number = 10,
    dept: string = '',
    type: string = '',
    includeImages: 'primary' | 'all' = 'primary'
  ): Observable<{ products: Product[]; total: number; page: number; pages: number }> {
    const params: any = { page, limit, includeImages };
    if (dept) {
      params.dept = dept;
    }
    if (type) {
      params.type = type;
    }
    return this._http
      .get<{ products: Product[]; total: number; page: number; pages: number }>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Cached version of getProducts for the main catalog:
   * we always fetch page 1 with a large limit once, then serve from memory.
   */
  getProductsCachedForCatalog(limit: number = 100): Observable<{ products: Product[]; total: number; page: number; pages: number }> {
    const now = Date.now();
    const isFresh = this.productsCache && (now - this.productsCacheTimestamp) < this.CACHE_TTL_MS;

    if (isFresh) {
      return of({
        products: this.productsCache!,
        total: this.productsCache!.length,
        page: 1,
        pages: 1
      });
    }

    return this.getProducts(1, limit).pipe(
      tap(res => {
        this.productsCache = res.products;
        this.productsCacheTimestamp = now;
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    return this._http
      .get<Product>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Cached product detail by id – avoids refetching when user navigates
   * back and forth between catalog and product page.
   */
  getProductByIdCached(id: string): Observable<Product> {
    const cached = this.productDetailCache.get(id);
    if (cached) {
      return of(cached);
    }

    return this.getProductById(id).pipe(
      tap(product => {
        this.productDetailCache.set(id, product);
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this._http
      .get<Product[]>(`${this.apiUrl}?dept=${category}&includeImages=primary`, {
        headers: this.getHeaders()
      })
      .pipe(retry(3), catchError(this.handleError));
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
      .pipe(catchError(this.handleError));
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
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: string): Observable<any> {
    return this._http
      .delete(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  deleteMultipleProducts(ids: string[]): Observable<any> {
    return this._http
      .request('delete', this.apiUrl, {
        headers: this.getHeaders(),
        body: { productIds: ids }
      })
      .pipe(catchError(this.handleError));
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
