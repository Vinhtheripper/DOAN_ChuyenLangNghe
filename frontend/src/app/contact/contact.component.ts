import { Component } from '@angular/core';
import { FeedbackAPIService } from '../feedback-api.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  constructor(private feedbackAPIService: FeedbackAPIService) { }

  onSubmit(event: Event): void {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value || '';

    this.feedbackAPIService.submitFeedback({ fullName, email, phone, message }).subscribe({
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
