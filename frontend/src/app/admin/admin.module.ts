import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe, SlicePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { AdminRoutingModule } from './admin-routing.module';
import { NavComponent } from './nav/nav.component';
import { MainpageComponent } from './mainpage/mainpage.component';
import { AdminComponent } from './admin/admin.component';
import { ProductManagementComponent } from './product-management/product-management.component';
import { OrderManagementComponent } from './order-management/order-management.component';

import { AuthGuard } from '../guards/auth.guard';
import { AuthService } from '../services/auth.service';
import { ProductAPIService } from '../product-api.service';
import { OrderAPIService } from '../order-api.service';
import { BlogAPIService } from '../blog-api.service';
import { ContactAPIService } from '../contact-api.service';
import { DashboardAPIService } from '../dashboard-api.service';
import { UserManagementComponent } from './user-management/user-management.component';
import { BlogManagementComponent } from './blog-management/blog-management.component';
import { ContactManagementComponent } from './contact-management/contact-management.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CouponManagementComponent } from './coupon-management/coupon-management.component';

@NgModule({
  declarations: [
    NavComponent,
    MainpageComponent,
    AdminComponent,
    ProductManagementComponent,
    OrderManagementComponent,
    UserManagementComponent,
    BlogManagementComponent,
    ContactManagementComponent,
    DashboardComponent,
    CouponManagementComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BaseChartDirective,
  ],
  providers: [
    AuthGuard,
    AuthService,
    ProductAPIService,
    OrderAPIService,
    BlogAPIService,
    ContactAPIService,
    DashboardAPIService,
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    SlicePipe,
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AdminComponent]
})
export class AdminModule { }
