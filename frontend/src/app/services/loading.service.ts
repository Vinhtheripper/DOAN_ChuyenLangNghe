import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private loadingCount = 0;
  private showTime: number = 0;
  private minDisplayTime = 150; // Minimum time to display loading (ms) - fast!
  private maxDisplayTime = 2500; // Keep overlays short enough to not feel stuck.
  private maxTimeout: any = null;
  private hideTimeout: any = null;

  constructor() { }

  show(): void {
    this.loadingCount++;
    if (this.loadingCount > 0 && !this.loadingSubject.value) {
      this.showTime = Date.now();
      this.loadingSubject.next(true);
      
      // Set maximum timeout - force hide after 4 seconds
      this.clearMaxTimeout();
      this.maxTimeout = setTimeout(() => {
        this.forceHide();
      }, this.maxDisplayTime);
    }
  }

  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.clearMaxTimeout();
      this.clearHideTimeout();
      
      // Calculate how long loading has been displayed
      const elapsed = Date.now() - this.showTime;
      const remaining = Math.max(0, this.minDisplayTime - elapsed);
      
      // Hide after minimum display time to avoid flash
      this.hideTimeout = setTimeout(() => {
        this.loadingSubject.next(false);
        this.hideTimeout = null;
      }, remaining);
    }
  }

  forceHide(): void {
    this.loadingCount = 0;
    this.clearMaxTimeout();
    this.clearHideTimeout();
    this.loadingSubject.next(false);
  }

  private clearMaxTimeout(): void {
    if (this.maxTimeout) {
      clearTimeout(this.maxTimeout);
      this.maxTimeout = null;
    }
  }

  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
