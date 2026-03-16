import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

const AUTO_CHANGE_SECONDS = 8;

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video1', { static: true }) video1!: ElementRef<HTMLVideoElement>;
  @ViewChild('video2', { static: true }) video2!: ElementRef<HTMLVideoElement>;
  @ViewChild('video3', { static: true }) video3!: ElementRef<HTMLVideoElement>;
  @ViewChild('slide4', { static: true }) slide4!: ElementRef<HTMLImageElement>;

  currentIndex: number = 0;
  slides: (HTMLVideoElement | HTMLImageElement)[] = [];
  progress: number[] = [0, 0, 0, 0];
  intervalId: any;
  autoChangeTimer: any;
  slideCount = 4;

  ngAfterViewInit(): void {
    this.slides = [
      this.video1.nativeElement,
      this.video2.nativeElement,
      this.video3.nativeElement,
      this.slide4.nativeElement
    ];
    this.slides.forEach((el, i) => {
      if (el instanceof HTMLVideoElement) {
        el.muted = true;
        el.playsInline = true;
      }
    });

    setTimeout(() => {
      [1, 2].forEach(i => {
        const v = this.slides[i];
        if (v instanceof HTMLVideoElement && v.preload !== 'auto') {
          v.preload = 'metadata';
          v.load();
        }
      });
    }, 300);

    setTimeout(() => this.showSlide(0), 100);
  }

  showSlide(index: number): void {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.slides.forEach((el, i) => {
      el.classList.remove('active');
      this.progress[i] = 0;
      if (el instanceof HTMLVideoElement) {
        el.pause();
        el.currentTime = 0;
      }
    });

    const el = this.slides[index];
    el.classList.add('active');

    if (el instanceof HTMLVideoElement) {
      el.play().catch(err => console.error('Video play error:', err));
      el.onended = () => this.nextSlide();
      el.ontimeupdate = () => {
        if (el.duration && el.currentTime > el.duration - 1.5) {
          const next = this.slides[(index + 1) % this.slideCount];
          if (next instanceof HTMLVideoElement && next.preload !== 'auto') {
            next.preload = 'auto';
            next.load();
          }
        }
        if (el.duration > 0) this.progress[index] = (el.currentTime / el.duration) * 100;
      };
    } else {
      let elapsed = 0;
      this.intervalId = setInterval(() => {
        elapsed += 100;
        this.progress[index] = Math.min(100, (elapsed / (AUTO_CHANGE_SECONDS * 1000)) * 100);
      }, 100);
    }

    this.currentIndex = index;
    clearTimeout(this.autoChangeTimer);
    this.autoChangeTimer = setTimeout(() => this.nextSlide(), AUTO_CHANGE_SECONDS * 1000);
  }

  nextSlide(): void {
    const nextIndex = (this.currentIndex + 1) % this.slideCount;
    this.showSlide(nextIndex);
  }

  handleClick(index: number): void {
    this.showSlide(index);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    clearTimeout(this.autoChangeTimer);
  }
}
