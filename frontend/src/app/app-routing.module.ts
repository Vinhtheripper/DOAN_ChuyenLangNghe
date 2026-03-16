import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { ContactFaqComponent } from './contact-faq/contact-faq.component';
import { IntroComponent } from './intro/intro.component';
import { PolicyComponent } from './policy/policy.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { CartComponent } from './cart/cart.component';
import { PaymentComponent } from './payment/payment.component';
import { TermsComponent } from './terms/terms.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { BlogComponent } from './blog/blog.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { HistoryComponent } from './history/history.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { DeliveryMethodsComponent } from './delivery-methods/delivery-methods.component';
import { HowToBuyComponent } from './how-to-buy/how-to-buy.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'contact', component: ContactFaqComponent },
  { path: 'about', component: IntroComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'delivery', component: DeliveryComponent },
  { path: 'delivery-methods', component: DeliveryMethodsComponent },
  { path: 'how-to-buy', component: HowToBuyComponent },
  { path: 'policy', component: PolicyComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'product/:id', component: ProductPageComponent },
  { path: 'cart', component: CartComponent },
  { path: 'payment', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'term', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'catalog', component: ProductCatalogComponent },
  { path: 'personal-info', component: PersonalInfoComponent, canActivate: [AuthGuard] },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { requiresAdmin: true }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
