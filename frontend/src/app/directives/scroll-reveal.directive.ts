import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]'
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input('appScrollReveal') revealClass: string = 'reveal-fade-up';
  @Input() revealOnce: boolean = true;
  @Input() revealRootMargin: string = '0px 0px -10% 0px';

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Start hidden and with the chosen animation class
    this.renderer.addClass(this.el.nativeElement, 'reveal-hidden');
    this.renderer.addClass(this.el.nativeElement, this.revealClass);

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.addClass(this.el.nativeElement, 'reveal-show');
            if (this.revealOnce && this.observer) {
              this.observer.unobserve(this.el.nativeElement);
            }
          } else if (!this.revealOnce) {
            this.renderer.removeClass(this.el.nativeElement, 'reveal-show');
          }
        });
      },
      { root: null, rootMargin: this.revealRootMargin, threshold: 0.1 }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}










































