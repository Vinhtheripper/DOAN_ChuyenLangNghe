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
  private maxDisplayTime = 4000; // Maximum time to display loading (ms) - 4 seconds
  private maxTimeout: any = null;

  constructor() { }

  show(): void {
    this.loadingCount++;
    if (this.loadingCount > 0 && !this.loadingSubject.value) {
      this.showTime = Date.now();
      this.loadingSubject.next(true);
      
      // Set maximum timeout - force hide after 4 seconds
      this.clearMaxTimeout();
      this.maxTimeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached (4s) - forcing hide');
        this.forceHide();
      }, this.maxDisplayTime);
    }
  }

  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.clearMaxTimeout();
      
      // Calculate how long loading has been displayed
      const elapsed = Date.now() - this.showTime;
      const remaining = Math.max(0, this.minDisplayTime - elapsed);
      
      // Hide after minimum display time to avoid flash
      setTimeout(() => {
        this.loadingSubject.next(false);
      }, remaining);
    }
  }

  forceHide(): void {
    this.loadingCount = 0;
    this.clearMaxTimeout();
    this.loadingSubject.next(false);
  }

  private clearMaxTimeout(): void {
    if (this.maxTimeout) {
      clearTimeout(this.maxTimeout);
      this.maxTimeout = null;
    }
  }
}

