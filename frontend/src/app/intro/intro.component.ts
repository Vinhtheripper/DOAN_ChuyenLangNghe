import { Component, HostListener, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FlipBookPage } from '../flip-book/flip-book.component';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.css']
})
export class IntroComponent implements OnInit, AfterViewInit {
  showScrollButton: boolean = false;
  hatRotation: number = -45;

  /** Trang sách lật - thêm/đổi ảnh trong imageLeft, imageRight sau */
  flipBookPages: FlipBookPage[] = [
    { title: 'Làng nghề truyền thống', imageLeft: undefined, imageRight: undefined },
    { title: 'Nghệ nhân và sản phẩm', imageLeft: undefined, imageRight: undefined },
    { title: 'Giá trị văn hóa', imageLeft: undefined, imageRight: undefined },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.updateHatRotation();
  }

  @HostListener('window:scroll', [])
  @HostListener('document:scroll', [])
  onWindowScroll(): void {
    this.updateHatRotation();
  }

  private updateHatRotation(): void {
    const scrollY = window.pageYOffset ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
    this.showScrollButton = scrollY > 300;

    const section = document.querySelector('.intro-video-section');
    if (section) {
      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const progress = (viewportH / 2 - rect.top) / (viewportH * 0.6);
      this.hatRotation = Math.max(-90, Math.min(90, progress * 90));
    } else {
      this.hatRotation = Math.max(-90, Math.min(90, scrollY * 0.5 - 45));
    }
    this.cdr.detectChanges();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
