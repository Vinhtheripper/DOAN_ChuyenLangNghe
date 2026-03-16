import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { MainpageComponent } from './mainpage/mainpage.component';
import { ProductManagementComponent } from './product-management/product-management.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { BlogManagementComponent } from './blog-management/blog-management.component';
import { ContactManagementComponent } from './contact-management/contact-management.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CouponManagementComponent } from './coupon-management/coupon-management.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'mainpage', pathMatch: 'full' },
      { path: 'mainpage', component: MainpageComponent, data: { title: 'Trang chủ' } },
      { path: 'product-adm', component: ProductManagementComponent, data: { title: 'Chức năng/Sản phẩm' } },
      { path: 'order-adm', component: OrderManagementComponent, data: { title: 'Chức năng/Đơn hàng' } },
      {
        path: 'user-adm',
        component: UserManagementComponent,
        data: { title: 'Xác thực/Tài khoản' }
      },
      {
        path: 'blog-adm',
        component: BlogManagementComponent,
        data: { title: 'Chức năng/Blog' }
      },
      {
        path: 'contact-adm',
        component: ContactManagementComponent,
        data: { title: 'Chức năng/Liên hệ' }
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Chức năng/Biểu đồ' }
      },
      {
        path: 'coupon-adm',
        component: CouponManagementComponent,
        data: { title: 'Chức năng/Mã giảm giá' }
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
