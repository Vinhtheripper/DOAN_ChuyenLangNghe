import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-qr',
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.css']
})
export class QrComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() modalPaymentMethod: 'momo' | 'internet_banking' = 'momo';
  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  activeTab: 'momo' | 'internet_banking' = 'momo';
  selectedBank: 'vietcombank' | 'bidv' | null = null;
  countdown: number = 300;

  intervalId: any;

  ngOnInit(): void {
    if (this.isVisible) {
      this.startCountdown();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modalPaymentMethod'] && this.modalPaymentMethod) {
      this.activeTab = this.modalPaymentMethod;
      if (this.activeTab === 'internet_banking') {
        this.selectedBank = 'vietcombank';
      }
    }
  }

  startCountdown(): void {
    this.intervalId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.closeModal();
      }
    }, 1000);
  }

  switchTab(tab: 'momo' | 'internet_banking'): void {
    this.activeTab = tab;
    if (tab === 'internet_banking' && !this.selectedBank) {
      this.selectedBank = 'vietcombank';
    }
  }

  confirmPayment(): void {
    clearInterval(this.intervalId);
    this.paymentSuccess.emit();
  }

  closeModal(): void {
    clearInterval(this.intervalId);
    this.close.emit();
  }
}
