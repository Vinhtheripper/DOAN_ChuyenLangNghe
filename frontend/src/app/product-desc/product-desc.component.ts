import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProductAPIService, ProductReview } from '../product-api.service';

@Component({
  selector: 'app-product-desc',
  templateUrl: './product-desc.component.html',
  styleUrls: ['./product-desc.component.css']
})
export class ProductDescComponent implements OnInit {
  @Input() product: any;
  @Output() reviewAdded = new EventEmitter<void>();

  selectedTab: string = 'description';
  reviews: ProductReview[] = [];
  averageRating: number = 0;
  ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviewsPerPage: number = 4;
  currentPage: number = 1;
  totalReviews: number = 0;
  sortOrder: 'newest' | 'oldest' = 'newest';
  isLoggedIn: boolean = false;

  newComment: string = '';
  newReviewRating: number = 0;
  newReviewImages: string[] = [];
  submitLoading: boolean = false;
  reviewLoadError: string = '';

  constructor(
    private authService: AuthService,
    private productApi: ProductAPIService
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    if (tab === 'reviews' && this.product?._id) {
      this.loadReviews();
    }
  }

  loadReviews(): void {
    if (!this.product?._id) return;
    this.reviewLoadError = '';
    this.productApi.getProductReviews(this.product._id, this.currentPage, this.reviewsPerPage, this.sortOrder).subscribe({
      next: (data) => {
        this.reviews = data.reviews;
        this.totalReviews = data.total;
        this.averageRating = data.averageRating;
        this.ratingCounts = data.ratingCounts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      },
      error: () => {
        this.reviewLoadError = 'Không tải được đánh giá.';
        this.reviews = [];
        this.totalReviews = 0;
      }
    });
  }

  get ratingBars(): { stars: number; count: number; percent: number }[] {
    const total = this.totalReviews || 1;
    return [5, 4, 3, 2, 1].map(s => ({
      stars: s,
      count: this.ratingCounts[s] || 0,
      percent: total ? ((this.ratingCounts[s] || 0) / total) * 100 : 0
    }));
  }

  setRating(value: number): void {
    this.newReviewRating = value;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    const remaining = 5 - this.newReviewImages.length;
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        if (data && this.newReviewImages.length < 5) {
          this.newReviewImages = [...this.newReviewImages, data];
        }
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeReviewImage(index: number): void {
    this.newReviewImages = this.newReviewImages.filter((_, i) => i !== index);
  }

  addReview(): void {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để thêm đánh giá.');
      return;
    }
    if (this.newReviewRating < 1 || this.newReviewRating > 5) {
      alert('Vui lòng chọn số sao đánh giá.');
      return;
    }
    if (!this.product?._id) return;

    this.submitLoading = true;
    this.productApi.submitReview(this.product._id, {
      rating: this.newReviewRating,
      comment: this.newComment.trim() || 'Đánh giá từ người dùng.',
      images: this.newReviewImages.length ? this.newReviewImages : undefined
    }).subscribe({
      next: () => {
        this.newComment = '';
        this.newReviewRating = 0;
        this.newReviewImages = [];
        this.reviewAdded.emit();
        this.loadReviews();
        this.submitLoading = false;
      },
      error: (err) => {
        this.submitLoading = false;
        alert(err.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.');
      }
    });
  }

  getSortedReviews(): ProductReview[] {
    const list = [...this.reviews];
    return this.sortOrder === 'oldest' ? list.reverse() : list;
  }

  applySort(): void {
    this.currentPage = 1;
    this.loadReviews();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = String(name).replace(/[^a-zA-ZÀ-ỹ\s]/g, '').split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] || '') + (parts[1][0] || '');
    return (name[0] || 'U').toUpperCase();
  }

  getStartIndex(): number {
    return this.totalReviews ? (this.currentPage - 1) * this.reviewsPerPage + 1 : 0;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.reviewsPerPage, this.totalReviews);
  }

  get totalPages(): number {
    return Math.ceil(this.totalReviews / this.reviewsPerPage);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadReviews();
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  formatReviewDate(d: string | Date): string {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return '1 ngày trước';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 tháng trước';
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 năm trước' : `${diffYears} năm trước`;
  }
}
