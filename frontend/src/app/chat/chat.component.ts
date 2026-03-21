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
  messages: { role: string; content: string; read?: boolean }[] = [];

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
    // Simulate response delay
    setTimeout(() => {
      const response = this.getResponseForMessage(message.toLowerCase());
      this.messages.push({ role: 'assistant', content: response, read: false });
      if (!this.isChatOpen) {
        this.unreadMessages++;
      }
      
      // Reset sending state
      this.isSending = false;
    }, 1000);
  }

  private getResponseForMessage(message: string): string {
    // Simple keyword-based responses
    if (message.includes('xin chào') || message.includes('hello') || message.includes('chào')) {
      return 'Xin chào! Tôi là trợ lý của ĐẶC SẢN 3 MIỀN. Tôi có thể giúp bạn tìm hiểu về sản phẩm, đặt hàng hoặc hỗ trợ khác. Bạn cần gì ạ?';
    }
    
    if (message.includes('sản phẩm') || message.includes('mua') || message.includes('giá')) {
      return 'Chúng tôi có rất nhiều đặc sản từ 3 miền Bắc - Trung - Nam như thịt trâu gác bếp, chè xanh, kẹo lạc... Bạn có thể xem danh mục sản phẩm hoặc cho tôi biết bạn quan tâm đến sản phẩm nào nhé!';
    }
    
    if (message.includes('đặt hàng') || message.includes('mua hàng')) {
      return 'Để đặt hàng, bạn có thể:\n1. Chọn sản phẩm từ danh mục\n2. Thêm vào giỏ hàng\n3. Thanh toán khi nhận hàng hoặc qua Internet Banking, Momo\n4. Chúng tôi sẽ giao hàng tận nơi cho bạn!';
    }
    
    if (message.includes('vận chuyển') || message.includes('giao hàng')) {
      return 'Chúng tôi giao hàng toàn quốc với phí vận chuyển hợp lý. Đơn hàng trên 500.000đ sẽ được miễn phí vận chuyển. Thời gian giao hàng từ 2-5 ngày làm việc.';
    }
    
    if (message.includes('liên hệ') || message.includes('hotline') || message.includes('điện thoại')) {
      return 'Bạn có thể liên hệ với chúng tôi qua:\n📞 Hotline: 1900-xxxx\n📧 Email: info@dacsan3mien.com\n💬 Chat trực tiếp như này\n🌐 Website: dacsan3mien.com';
    }
    
    if (message.includes('cảm ơn') || message.includes('thank')) {
      return 'Không có gì ạ! Rất vui được hỗ trợ bạn. Nếu cần thêm thông tin gì, bạn cứ hỏi tôi nhé! 😊';
    }
    
    if (message.includes('giờ mở cửa') || message.includes('giờ làm việc')) {
      return 'Chúng tôi hoạt động 24/7 online! Bạn có thể đặt hàng bất cứ lúc nào. Đội ngũ chăm sóc khách hàng sẽ phản hồi trong giờ hành chính (8:00-17:00).';
    }
    
    if (message.includes('khuyến mãi') || message.includes('giảm giá') || message.includes('sale')) {
      return 'Hiện tại chúng tôi đang có nhiều chương trình khuyến mãi hấp dẫn:\n🎉 Giảm giá lên đến 50% cho các sản phẩm đặc biệt\n🎁 Miễn phí vận chuyển cho đơn hàng trên 500k\n🎊 Tặng kèm quà cho khách hàng VIP';
    }
    
    // Default response
    return 'Cảm ơn bạn đã liên hệ! Tôi hiểu bạn đang tìm hiểu về "ĐẶC SẢN 3 MIỀN". Bạn có thể hỏi tôi về:\n• Sản phẩm và giá cả\n• Cách đặt hàng\n• Chính sách vận chuyển\n• Thông tin liên hệ\n• Khuyến mãi hiện tại\nHoặc bất kỳ câu hỏi nào khác, tôi sẵn sàng hỗ trợ! 😊';
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
    // Convert line breaks to HTML
    return content.replace(/\n/g, '<br>');
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
