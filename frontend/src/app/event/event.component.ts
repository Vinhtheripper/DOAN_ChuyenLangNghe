import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements AfterViewInit {
  @ViewChild('eventVideo', { static: true }) eventVideo!: ElementRef<HTMLVideoElement>;
  showControls: boolean = false;

  ngAfterViewInit(): void {
    const video = this.eventVideo?.nativeElement;
    if (!video) return;

    // Ensure proper flags for autoplay on mobile
    video.muted = true;
    video.playsInline = true as any;
    video.preload = 'auto';

    // Try to play immediately
    this.tryPlay(video);

    // Also start when it becomes visible (in case initial attempt was before layout)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          this.tryPlay(video);
        }
      });
    }, { threshold: 0.2 });
    io.observe(video);
  }

  private tryPlay(video: HTMLVideoElement): void {
    const playPromise = video.play();
    if (playPromise && typeof (playPromise as any).catch === 'function') {
      (playPromise as Promise<void>).catch(() => {
        // Autoplay blocked — show controls so user can tap to start
        this.showControls = true;
      });
    }
  }
}
