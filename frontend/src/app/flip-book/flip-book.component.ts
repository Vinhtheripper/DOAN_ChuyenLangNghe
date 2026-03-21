import { Component, Input, HostListener, ElementRef, ViewChild } from '@angular/core';

export interface FlipBookPage {
  /** Ảnh hoặc nội dung trang (trái) */
  imageLeft?: string;
  /** Ảnh hoặc nội dung trang (phải) - mỗi spread có 2 trang */
  imageRight?: string;
  /** Tiêu đề (tùy chọn) */
  title?: string;
  /** Mô tả (tùy chọn) */
  description?: string;
}

const FLIP_DURATION_MS = 420;
const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

@Component({
  selector: 'app-flip-book',
  templateUrl: './flip-book.component.html',
  styleUrls: ['./flip-book.component.css']
})
export class FlipBookComponent {
  @Input() pages: FlipBookPage[] = [];
  @Input() bookWidth: number = 420;
  @Input() bookHeight: number = 600;

  @ViewChild('bookContainer') bookContainer!: ElementRef<HTMLElement>;

  /** Sách đóng: chỉ hiện bìa; lật ra mới thành 2 trang */
  isBookOpen = false;
  currentPage = 0;
  isFlipping = false;
  flipDirection: 'next' | 'prev' | null = null;

  /** Giá trị lật thống nhất: âm = lật trái, dương = lật phải (dùng cho transform) */
  flipProgress = 0;
  /** Đang kéo bằng chuột */
  isDragging = false;
  /** Đang chạy animation lật (mở sách / đóng / next / prev) */
  animating = false;
  animTarget: 1 | -1 | null = null;
  private dragStartX = 0;
  private readonly flipThreshold = 0.25;
  private rafId: number | null = null;
  private animStartValue = 0;
  private animStartTime = 0;
  private animOnComplete: (() => void) | null = null;

  get totalPages(): number {
    return this.pages.length;
  }

  /** Số spread (bìa + các trang), dùng cho hiển thị "x / y" */
  get totalSpreads(): number {
    return this.pages.length + 1;
  }

  get canGoNext(): boolean {
    return !this.isFlipping && !this.animating && (this.currentPage < this.totalPages || !this.isBookOpen);
  }

  get canGoPrev(): boolean {
    return !this.isFlipping && !this.animating && (this.currentPage > 0 || (this.isBookOpen && this.currentPage === 0));
  }

  /** Animation lật mượt tới target (1 hoặc -1), xong gọi onComplete */
  private animateTo(target: 1 | -1, onComplete: () => void): void {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.animating = true;
    this.animTarget = target;
    this.animStartValue = this.flipProgress;
    this.animStartTime = performance.now();
    this.animOnComplete = onComplete;

    const tick = (): void => {
      const elapsed = performance.now() - this.animStartTime;
      const t = Math.min(elapsed / FLIP_DURATION_MS, 1);
      const eased = EASE_OUT_CUBIC(t);
      this.flipProgress = this.animStartValue + (target - this.animStartValue) * eased;

      if (t >= 1) {
        this.rafId = null;
        this.animating = false;
        this.animTarget = null;
        this.flipProgress = 0;
        this.animOnComplete?.();
        this.animOnComplete = null;
        return;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  next(): void {
    if (!this.canGoNext) return;
    if (!this.isBookOpen) {
      this.flipProgress = Math.max(this.flipProgress, 0.02);
      this.animateTo(1, () => { this.isBookOpen = true; });
      return;
    }
    this.isFlipping = true;
    this.flipDirection = 'next';
    this.flipProgress = 0.02;
    this.animateTo(1, () => {
      this.currentPage++;
      this.isFlipping = false;
      this.flipDirection = null;
    });
  }

  prev(): void {
    if (!this.canGoPrev) return;
    if (this.isBookOpen && this.currentPage === 0) {
      this.flipProgress = Math.min(this.flipProgress, -0.02);
      this.animateTo(-1, () => { this.isBookOpen = false; });
      return;
    }
    this.isFlipping = true;
    this.flipDirection = 'prev';
    this.flipProgress = -0.02;
    this.animateTo(-1, () => {
      this.currentPage--;
      this.isFlipping = false;
      this.flipDirection = null;
    });
  }

  onDragStart(e: MouseEvent | TouchEvent): void {
    if (this.animating || this.isFlipping) return;
    this.isDragging = true;
    this.dragStartX = this.getClientX(e);
  }

  /** Di chuột phải→trái = lật trang qua phải (next); trái→phải = lật trang qua trái (prev) */
  onDragMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    const x = this.getClientX(e);
    const delta = x - this.dragStartX;
    const maxDrag = this.bookWidth * 0.8;
    let progress = -delta / maxDrag;
    if (progress > 0 && !this.canGoNext) progress = 0;
    if (progress < 0 && !this.canGoPrev) progress = 0;
    this.flipProgress = Math.max(-1, Math.min(1, progress));
  }

  onDragEnd(): void {
    if (!this.isDragging) return;
    if (this.flipProgress > this.flipThreshold && this.canGoNext) {
      if (!this.isBookOpen) {
        this.animateTo(1, () => { this.isBookOpen = true; });
      } else {
        this.isFlipping = true;
        this.flipDirection = 'next';
        this.animateTo(1, () => {
          this.currentPage++;
          this.isFlipping = false;
          this.flipDirection = null;
        });
      }
    } else if (this.flipProgress < -this.flipThreshold && this.canGoPrev) {
      if (this.isBookOpen && this.currentPage === 0) {
        this.animateTo(-1, () => { this.isBookOpen = false; });
      } else {
        this.isFlipping = true;
        this.flipDirection = 'prev';
        this.animateTo(-1, () => {
          this.currentPage--;
          this.isFlipping = false;
          this.flipDirection = null;
        });
      }
    } else {
      this.flipProgress = 0;
    }
    this.isDragging = false;
  }

  private getClientX(e: MouseEvent | TouchEvent): number {
    return 'touches' in e ? e.touches[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0 : e.clientX;
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend', ['$event'])
  onGlobalPointerUp(e?: TouchEvent): void {
    this.onDragEnd();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onGlobalPointerMove(e: MouseEvent | TouchEvent): void {
    this.onDragMove(e);
  }
}
