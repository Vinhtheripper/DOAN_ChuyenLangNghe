import { Component, OnInit } from '@angular/core';
import { Product } from '../../../interface/Product';
import { ProductAPIService } from '../../product-api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products: Product[] = [];
  totalProducts: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  selectedProduct: Product | null = null;
  isEditing: boolean = false;
  productForm: FormGroup;
  selectedProducts: string[] = [];
  loading: boolean = false;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  filterDept: string = '';
  filterType: string = '';
  filterPriceRange: string = '';
  filterStock: string = '';
  canEdit: boolean = false;
  canView: boolean = false;
  images: string[] = ['', '', '', '', ''];
  showFilters: boolean = false;

  constructor(
    private productService: ProductAPIService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.productForm = this.fb.group({
      product_name: ['', Validators.required],
      product_detail: [''],
      stocked_quantity: [0, [Validators.required, Validators.min(0)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(1)]],
      product_dept: [''],
      type: ['nen', Validators.required],
      rating: [4, [Validators.min(0), Validators.max(5)]],
      image_1: [''],
      image_2: [''],
      image_3: [''],
      image_4: [''],
      image_5: [''],
    });
  }

  ngOnInit(): void {
    this.setPermissions();
    if (this.canView) {
      this.loadProducts();
    }
  }

  setPermissions(): void {
    const action = this.authService.getAction();
    this.canEdit = action === 'edit all' || action === 'sales ctrl' || action === 'account ctrl';
    this.canView = this.canEdit || action === 'just view';
  }

  clearImage(index: number): void {
    this.images[index] = '';
    this.productForm.patchValue({ [`image_${index + 1}`]: '' });
    this.productForm.updateValueAndValidity();
  }

  get totalPages(): number {
    return Math.ceil(this.totalProducts / this.pageSize);
  }

  loadProducts(): void {
    if (!this.canView) {
      return;
    }
    this.loading = true;
    this.productService.getProducts(this.currentPage, this.pageSize, this.filterDept, this.filterType, 'all').subscribe({
      next: (data) => {
        this.products = data.products;
        this.totalProducts = data.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onImageChange(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.images[index] = base64String;
      this.productForm.patchValue({ [`image_${index + 1}`]: base64String });
    };

    reader.readAsDataURL(file);
  }

  createProduct(): void {
    if (this.productForm.invalid) {
      return;
    }
    if (!this.canEdit) {
      alert('Bạn cần quyền "edit all", "sales ctrl" hoặc "account ctrl" để thêm sản phẩm. Vui lòng đăng nhập tài khoản admin@uel.edu.vn, sales@uel.edu.vn hoặc hr@uel.edu.vn (mật khẩu: 112233).');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.loading = true;

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 20;
        if (this.uploadProgress > 90) this.uploadProgress = 90;
      }
    }, 200);

    const sanitizedProduct: Record<string, any> = { ...this.productForm.value };

    const imageFields = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];
    for (const field of imageFields) {
      if (!sanitizedProduct[field]) {
        sanitizedProduct[field] = '';
      }
    }

    this.productService.createProduct(sanitizedProduct).subscribe({
      next: () => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          this.loadProducts();
          this.productForm.reset();
          this.images = ['', '', '', '', ''];
          const fileInputs = document.querySelectorAll('input[type="file"]');
          fileInputs.forEach(input => {
            (input as HTMLInputElement).value = '';
          });
          this.isUploading = false;
          this.loading = false;
          this.uploadProgress = 0;
        }, 500);
      },
      error: (err) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.loading = false;
        this.uploadProgress = 0;
        alert(err.message);
      },
    });
  }

  editProduct(product: Product): void {
    if (!this.canEdit) {
      return;
    }
    this.isEditing = true;
    this.selectedProduct = product;
    this.productForm.patchValue(product);
    this.images = [
      product.image_1 || '',
      product.image_2 || '',
      product.image_3 || '',
      product.image_4 || '',
      product.image_5 || '',
    ];
  }

  updateProduct(): void {
    if (!this.canEdit || this.productForm.invalid || !this.selectedProduct) {
      return;
    }

    const sanitizedProduct: Record<string, any> = { ...this.productForm.value };

    const imageFields = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];
    for (const field of imageFields) {
      if (!sanitizedProduct[field]) {
        sanitizedProduct[field] = '';
      }
    }

    this.productService.updateProduct(this.selectedProduct._id!, sanitizedProduct).subscribe({
      next: () => {
        this.loadProducts();
        this.cancelEdit();
        this.images = ['', '', '', '', ''];
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          (input as HTMLInputElement).value = '';
        });
      },
      error: (err) => {
        alert(err.message);
      },
    });
  }

  deleteProduct(productId: string): void {
    if (!this.canEdit || !confirm('Are you sure you want to delete this product?')) {
      return;
    }
    this.productService.deleteProduct(productId).subscribe({
      next: () => this.loadProducts()
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedProduct = null;
    this.productForm.reset();
    this.images = ['', '', '', '', ''];
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      (input as HTMLInputElement).value = '';
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  isSelected(productId: string): boolean {
    return this.selectedProducts.includes(productId);
  }

  toggleSelect(productId: string): void {
    if (this.isSelected(productId)) {
      this.selectedProducts = this.selectedProducts.filter(id => id !== productId);
    } else {
      this.selectedProducts.push(productId);
    }
  }

  toggleSelectAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedProducts = this.products.map(product => product._id!);
    } else {
      this.selectedProducts = [];
    }
  }

  deleteSelectedProducts(): void {
    if (!this.canEdit || !confirm('Are you sure you want to delete the selected products?')) {
      return;
    }
    this.productService.deleteMultipleProducts(this.selectedProducts).subscribe({
      next: () => {
        this.loadProducts();
        this.selectedProducts = [];
      }
    });
  }

  applyDeptFilter(dept: string): void {
    this.filterDept = dept;
    this.currentPage = 1;
    this.loadProducts();
  }

  applyTypeFilter(type: string): void {
    this.filterType = type;
    this.currentPage = 1;
    this.loadProducts();
  }

  applyPriceFilter(priceRange: string): void {
    this.filterPriceRange = priceRange;
    this.currentPage = 1;
    this.loadProducts();
  }

  applyStockFilter(stock: string): void {
    this.filterStock = stock;
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filterDept = '';
    this.filterType = '';
    this.filterPriceRange = '';
    this.filterStock = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  getFilteredProducts(): Product[] {
    let filtered = [...this.products];

    if (this.filterDept) {
      filtered = filtered.filter(p => p.product_dept.toLowerCase().includes(this.filterDept.toLowerCase()));
    }

    if (this.filterType) {
      filtered = filtered.filter(p => p.type === this.filterType);
    }

    if (this.filterPriceRange) {
      const [min, max] = this.filterPriceRange.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(p => p.unit_price >= min && p.unit_price <= max);
      } else {
        filtered = filtered.filter(p => p.unit_price >= min);
      }
    }

    if (this.filterStock) {
      if (this.filterStock === 'in-stock') {
        filtered = filtered.filter(p => p.stocked_quantity > 0);
      } else if (this.filterStock === 'out-of-stock') {
        filtered = filtered.filter(p => p.stocked_quantity === 0);
      } else if (this.filterStock === 'low-stock') {
        filtered = filtered.filter(p => p.stocked_quantity > 0 && p.stocked_quantity <= 10);
      }
    }

    return filtered;
  }

  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'nen': 'Nến',
      'tre_may': 'Tre mây',
      'gom_su': 'Gốm sứ'
    };
    return typeLabels[type] || type;
  }
}
