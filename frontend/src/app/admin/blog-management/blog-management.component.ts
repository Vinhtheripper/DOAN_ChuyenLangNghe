import { Component, OnInit } from '@angular/core';
import { Blog } from '../../../interface/Blog';
import { BlogAPIService } from '../../blog-api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blog-management',
  templateUrl: './blog-management.component.html',
  styleUrls: ['./blog-management.component.css']
})
export class BlogManagementComponent implements OnInit {
  blogs: Blog[] = [];
  totalBlogs: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  selectedBlog: Blog | null = null;
  isEditing: boolean = false;
  blogForm: FormGroup;
  loading: boolean = false;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  canEdit: boolean = false;
  canView: boolean = false;
  blogImage: string = '';
  searchText: string = '';

  constructor(
    private blogService: BlogAPIService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      content: ['', Validators.required],
      image: [''],
      author: ['Admin'],
      published: [true]
    });
  }

  ngOnInit(): void {
    this.setPermissions();
    if (this.canView) {
      this.loadBlogs();
    }
  }

  setPermissions(): void {
    const action = this.authService.getAction();
    this.canEdit = action === 'edit all' || action === 'sales ctrl';
    this.canView = this.canEdit || action === 'just view';
  }

  get totalPages(): number {
    return Math.ceil(this.totalBlogs / this.pageSize);
  }

  loadBlogs(): void {
    if (!this.canView) {
      return;
    }
    this.loading = true;
    this.blogService.getBlogsForAdmin(this.currentPage, this.pageSize, this.searchText).subscribe({
      next: (data) => {
        this.blogs = data.blogs;
        this.totalBlogs = data.total;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading blogs:', err);
        alert('Không thể tải danh sách blog: ' + (err.error?.message || err.message || 'Lỗi không xác định'));
      }
    });
  }

  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.blogImage = base64String;
      this.blogForm.patchValue({ image: base64String });
    };

    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.blogImage = '';
    this.blogForm.patchValue({ image: '' });
    this.blogForm.updateValueAndValidity();
  }

  createBlog(): void {
    if (!this.canEdit || this.blogForm.invalid) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.loading = true;

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 20;
        if (this.uploadProgress > 90) this.uploadProgress = 90;
      }
    }, 200);

    this.blogService.createBlog(this.blogForm.value).subscribe({
      next: () => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          this.loadBlogs();
          this.blogForm.reset({
            author: 'Admin',
            published: true
          });
          this.blogImage = '';
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          this.isUploading = false;
          this.loading = false;
          this.uploadProgress = 0;
          alert('Tạo blog thành công!');
        }, 500);
      },
      error: (err) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.loading = false;
        this.uploadProgress = 0;
        alert('Lỗi khi tạo blog: ' + (err.error?.message || 'Lỗi không xác định'));
      },
    });
  }

  editBlog(blog: Blog): void {
    if (!this.canEdit) {
      return;
    }
    this.isEditing = true;
    this.selectedBlog = blog;
    this.blogForm.patchValue(blog);
    this.blogImage = blog.image || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateBlog(): void {
    if (!this.canEdit || this.blogForm.invalid || !this.selectedBlog) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    this.loading = true;
    this.blogService.updateBlog(this.selectedBlog._id!, this.blogForm.value).subscribe({
      next: () => {
        this.loadBlogs();
        this.cancelEdit();
        alert('Cập nhật blog thành công!');
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        alert('Lỗi khi cập nhật blog: ' + (err.error?.message || 'Lỗi không xác định'));
      },
    });
  }

  deleteBlog(blogId: string): void {
    if (!this.canEdit || !confirm('Bạn có chắc chắn muốn xóa blog này?')) {
      return;
    }
    this.blogService.deleteBlog(blogId).subscribe({
      next: () => {
        this.loadBlogs();
        alert('Xóa blog thành công!');
      },
      error: (err) => {
        alert('Lỗi khi xóa blog: ' + (err.error?.message || 'Lỗi không xác định'));
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedBlog = null;
    this.blogForm.reset({
      author: 'Admin',
      published: true
    });
    this.blogImage = '';
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBlogs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBlogs();
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadBlogs();
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  }
}
