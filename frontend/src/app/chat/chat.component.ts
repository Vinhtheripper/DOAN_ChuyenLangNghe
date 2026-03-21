import { Component } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  isChatOpen = false;
  userMessage = '';
  unreadMessages = 1;
  isSending = false;
  messages: { role: 'user' | 'assistant'; content: string; read?: boolean }[] = [];

  private messageSubject = new Subject<string>();
  private maxMessagesToSend = 10;

  private assistantGreetings = [
    'Xin chào, tôi là Trợ lý ảo. Rất vui được hỗ trợ bạn.',
    'Chào bạn, tôi có thể giúp gì cho bạn hôm nay?',
    'Xin chào! Bạn cần hỗ trợ gì?',
    'Chào mừng bạn! Tôi sẵn sàng hỗ trợ mọi câu hỏi của bạn.',
    'Hi! Bạn cần tìm hiểu gì? Tôi ở đây để giúp bạn.',
    'Xin chào, tôi là Trợ lý của ĐẶC SẢN 3 MIỀN. Rất hân hạnh được phục vụ bạn.',
  ];

  constructor() {
    this.messageSubject.pipe(debounceTime(1000)).subscribe((message) => {
      this.sendMessageToOpenAi(message);
    });

    this.setRandomGreeting();
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;

    if (this.isChatOpen) {
      this.markMessagesAsRead();
    }
  }

  sendMessage(): void {
    if (this.userMessage.trim() === '' || this.isSending) return;

    const messageToSend = this.userMessage.trim();
    
    // Set sending state
    this.isSending = true;
    
    // Add user message
    this.messages.push({ role: 'user', content: messageToSend, read: true });

    // Clear input immediately for better UX
    this.userMessage = '';

    // Send message for processing
    this.messageSubject.next(messageToSend);
  }

  private sendMessageToOpenAi(message: string): void {
    setTimeout(() => {
      const response = this.getResponseForMessage(message.toLowerCase());
      this.messages.push({ role: 'assistant', content: response, read: false });
      if (!this.isChatOpen) {
        this.unreadMessages++;
      }
      this.isSending = false;
    }, 1000);
  }

  private getResponseForMessage(message: string): string {
    if (message.includes('xin chào') || message.includes('hello') || message.includes('chào')) {
      return 'Xin chào! Tôi là trợ lý của Chuyện Làng Nghề. Tôi có thể hỗ trợ bạn về sản phẩm, cách đặt hàng và thông tin liên hệ.';
    }

    if (message.includes('sản phẩm') || message.includes('mua') || message.includes('giá')) {
      return 'Bạn có thể xem các sản phẩm thủ công tại trang danh mục. Nếu muốn, hãy nói rõ loại bạn quan tâm như gốm, mây tre đan hoặc quà tặng thủ công.';
    }

    if (message.includes('đặt hàng') || message.includes('mua hàng')) {
      return 'Để đặt hàng, bạn chọn sản phẩm, thêm vào giỏ, sau đó vào thanh toán và điền thông tin giao hàng.';
    }

    if (message.includes('vận chuyển') || message.includes('giao hàng')) {
      return 'Chúng tôi hỗ trợ giao hàng tận nơi. Bạn có thể xem thêm ở trang giao hàng hoặc phương thức giao hàng trên website.';
    }

    if (message.includes('liên hệ') || message.includes('hotline') || message.includes('điện thoại')) {
      return 'Bạn có thể liên hệ qua trang Liên hệ trên website để được hỗ trợ trực tiếp từ đội ngũ Chuyện Làng Nghề.';
    }

    if (message.includes('khuyến mãi') || message.includes('giảm giá') || message.includes('sale')) {
      return 'Bạn có thể theo dõi mục tin tức và khuyến mãi hoặc trang sản phẩm để xem các ưu đãi hiện có.';
    }

    if (message.includes('cảm ơn') || message.includes('thank')) {
      return 'Rất vui được hỗ trợ bạn. Nếu cần thêm thông tin, bạn cứ tiếp tục hỏi.';
    }

    return 'Mình hiện đang hỗ trợ các câu hỏi cơ bản về sản phẩm, đặt hàng, giao hàng và liên hệ. Nếu bạn cần, hãy mô tả rõ hơn nội dung muốn hỏi.';
  }

  private markMessagesAsRead(): void {
    this.messages.forEach((message) => {
      if (message.role === 'assistant') {
        message.read = true;
      }
    });
    this.unreadMessages = 0;
  }

  private setRandomGreeting(): void {
    const randomIndex = Math.floor(Math.random() * this.assistantGreetings.length);
    const randomGreeting = this.assistantGreetings[randomIndex];
    this.messages.push({ role: 'assistant', content: randomGreeting, read: false });
  }

  formatMessage(content: string): string {
    return this.escapeHtml(content).replace(/\n/g, '<br>');
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private escapeHtml(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
