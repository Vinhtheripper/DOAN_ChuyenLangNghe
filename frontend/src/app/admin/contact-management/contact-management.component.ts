import { Component, OnInit } from '@angular/core';
import { Contact } from '../../../interface/Contact';
import { ContactAPIService } from '../../contact-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contact-management',
  templateUrl: './contact-management.component.html',
  styleUrls: ['./contact-management.component.css']
})
export class ContactManagementComponent implements OnInit {
  contacts: Contact[] = [];
  totalContacts: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  selectedContact: Contact | null = null;
  loading: boolean = false;
  searchText: string = '';
  filterStatus: string = '';
  canEdit: boolean = false;
  canView: boolean = false;

  constructor(
    private contactService: ContactAPIService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setPermissions();
    if (this.canView) {
      this.loadContacts();
    }
  }

  setPermissions(): void {
    const action = this.authService.getAction();
    this.canEdit = action === 'edit all' || action === 'sales ctrl';
    this.canView = this.canEdit || action === 'just view';
  }

  get totalPages(): number {
    return Math.ceil(this.totalContacts / this.pageSize);
  }

  loadContacts(): void {
    if (!this.canView) {
      return;
    }
    this.loading = true;
    this.contactService.getContacts(this.currentPage, this.pageSize, this.searchText, this.filterStatus).subscribe({
      next: (data) => {
        this.contacts = data.feedback;
        this.totalContacts = data.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Không thể tải danh sách liên hệ');
      }
    });
  }

  viewContact(contact: Contact): void {
    this.selectedContact = contact;
    
    // Auto mark as read if it's new
    if (contact.status === 'new' && this.canEdit) {
      this.updateStatus(contact._id!, 'read', false);
    }
  }

  closeDetail(): void {
    this.selectedContact = null;
  }

  updateStatus(contactId: string, status: string, reload: boolean = true): void {
    if (!this.canEdit) {
      return;
    }
    
    this.contactService.updateStatus(contactId, status).subscribe({
      next: () => {
        if (reload) {
          this.loadContacts();
          alert('Cập nhật trạng thái thành công!');
        } else {
          // Update local status
          const contact = this.contacts.find(c => c._id === contactId);
          if (contact) {
            contact.status = status as any;
          }
        }
      },
      error: (err) => {
        alert('Lỗi khi cập nhật trạng thái: ' + (err.error?.message || 'Lỗi không xác định'));
      }
    });
  }

  deleteContact(contactId: string): void {
    if (!this.canEdit || !confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) {
      return;
    }
    
    this.contactService.deleteContact(contactId).subscribe({
      next: () => {
        this.loadContacts();
        this.selectedContact = null;
        alert('Xóa liên hệ thành công!');
      },
      error: (err) => {
        alert('Lỗi khi xóa liên hệ: ' + (err.error?.message || 'Lỗi không xác định'));
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadContacts();
  }

  onFilterStatus(status: string): void {
    this.filterStatus = status;
    this.currentPage = 1;
    this.loadContacts();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadContacts();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadContacts();
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN');
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      'new': 'Mới',
      'read': 'Đã đọc',
      'replied': 'Đã trả lời'
    };
    return labels[status || 'new'] || 'Mới';
  }

  getStatusClass(status?: string): string {
    const classes: { [key: string]: string } = {
      'new': 'bg-danger',
      'read': 'bg-warning',
      'replied': 'bg-success'
    };
    return classes[status || 'new'] || 'bg-secondary';
  }
}
