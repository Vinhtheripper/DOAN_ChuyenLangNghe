import { Component, ElementRef, ViewChild } from '@angular/core';
import { finalize } from 'rxjs';
import { ChatResponse, OpenAiService } from '../services/openai.service';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
  read?: boolean;
  sources?: string[];
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  @ViewChild('messageList') private messageList?: ElementRef<HTMLDivElement>;

  isChatOpen = false;
  userMessage = '';
  unreadMessages = 1;
  isSending = false;
  messages: ChatMessage[] = [];

  private assistantGreetings = [
    'Xin chào, tôi là trợ lý AI của Chuyện Làng Nghề. Tôi có thể hỗ trợ về sản phẩm, bài viết, ưu đãi và cách đặt hàng.',
    'Chào bạn, tôi có thể giúp bạn tìm sản phẩm thủ công, thông tin làng nghề hoặc khuyến mãi hiện có.',
    'Xin chào. Bạn muốn tìm hiểu sản phẩm, bài viết hay cần hỗ trợ mua hàng?',
  ];

  constructor(private readonly openAiService: OpenAiService) {
    this.setRandomGreeting();
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;

    if (this.isChatOpen) {
      this.markMessagesAsRead();
      this.scrollToBottom();
    }
  }

  sendMessage(): void {
    if (this.userMessage.trim() === '' || this.isSending) return;

    const messageToSend = this.userMessage.trim();
    this.userMessage = '';
    this.isSending = true;
    this.pushMessage({
      role: 'user',
      content: messageToSend,
      createdAt: new Date(),
      read: true
    });

    const payload = this.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role,
        content: message.content
      }));

    this.openAiService
      .sendMessage(payload)
      .pipe(finalize(() => (this.isSending = false)))
      .subscribe({
        next: (response) => this.handleAssistantResponse(response),
        error: () => {
          this.pushMessage({
            role: 'assistant',
            content: 'Hiện chưa kết nối được trợ lý AI từ hệ thống. Bạn thử lại sau ít phút.',
            createdAt: new Date(),
            read: this.isChatOpen
          });
        }
      });
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
    this.messages.push({
      role: 'assistant',
      content: randomGreeting,
      createdAt: new Date(),
      read: false
    });
  }

  formatMessage(content: string): string {
    return this.escapeHtml(content).replace(/\n/g, '<br>');
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByMessage(index: number): number {
    return index;
  }

  private handleAssistantResponse(response: ChatResponse): void {
    const sources = [
      ...(response.sources?.products ?? []),
      ...(response.sources?.blogs ?? []),
      ...(response.sources?.coupons ?? [])
    ];

    this.pushMessage({
      role: 'assistant',
      content: response.answer || 'Tôi chưa có câu trả lời phù hợp cho nội dung này.',
      createdAt: new Date(),
      read: this.isChatOpen,
      sources: sources.slice(0, 3)
    });
  }

  private pushMessage(message: ChatMessage): void {
    this.messages.push(message);

    if (message.role === 'assistant' && !this.isChatOpen) {
      this.unreadMessages += 1;
    }

    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.messageList?.nativeElement;
      if (!container) {
        return;
      }

      container.scrollTop = container.scrollHeight;
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
