import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  loadingMessage: string = 'Đang tải dữ liệu...';
  private subscription?: Subscription;
  private messageTimeout?: any;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.subscription = this.loadingService.loading$.subscribe(
      (loading: boolean) => {
        this.isLoading = loading;
        
        if (loading) {
          // Reset message
          this.loadingMessage = 'Đang tải dữ liệu...';
          
          // Show warning after 2 seconds
          this.clearMessageTimeout();
          this.messageTimeout = setTimeout(() => {
            this.loadingMessage = 'Vui lòng đợi thêm chút...';
          }, 2000);
        } else {
          this.clearMessageTimeout();
          this.loadingMessage = 'Đang tải dữ liệu...';
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.clearMessageTimeout();
  }

  private clearMessageTimeout(): void {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }
}
