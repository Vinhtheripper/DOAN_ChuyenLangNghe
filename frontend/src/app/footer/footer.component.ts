import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FeedbackAPIService } from '../feedback-api.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private feedbackAPIService: FeedbackAPIService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  onFeedbackSubmit(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement)?.value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value;

    this.feedbackAPIService.submitFeedback({ fullName, phone, message }).subscribe({
      next: () => {
        alert('Cảm ơn bạn đã gửi phản hồi!');
        form.reset();
      },
      error: (err) => {
        alert('Gửi phản hồi thất bại. Vui lòng thử lại.');
      }
    });
  }
}
