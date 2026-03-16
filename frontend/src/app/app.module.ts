import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './services/auth.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';
import { AuthGuard } from './guards/auth.guard';

import { AppComponent } from './app.component';
import { ProductListComponent } from './product-list/product-list.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { BannerComponent } from './banner/banner.component';
import { EventComponent } from './event/event.component';
import { SloganComponent } from './slogan/slogan.component';
import { HeaderComponent } from './header/header.component';
import { ContactComponent } from './contact/contact.component';
import { FaqComponent } from './faq/faq.component';
import { ContactFaqComponent } from './contact-faq/contact-faq.component';
import { HomepageComponent } from './homepage/homepage.component';
import { FooterComponent } from './footer/footer.component';
import { AboutComponent } from './about/about.component';
import { VisionMisionComponent } from './vision-mision/vision-mision.component';
import { CtaComponent } from './cta/cta.component';
import { SlideshowComponent } from './slideshow/slideshow.component';
import { IntroComponent } from './intro/intro.component';
import { PolicyComponent } from './policy/policy.component';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { ProductItemComponent } from './product-item/product-item.component';
import { ProductEventComponent } from './product-event/product-event.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { ProductDescComponent } from './product-desc/product-desc.component';
import { RelatedProductComponent } from './related-product/related-product.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { CartComponent } from './cart/cart.component';
import { PaymentComponent } from './payment/payment.component';
import { SnowfallComponent } from './snowfall/snowfall.component';
import { MusicplayerComponent } from './musicplayer/musicplayer.component';
import { TermsComponent } from './terms/terms.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { BlogComponent } from './blog/blog.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { ChatComponent } from './chat/chat.component';
import { QrComponent } from './qr/qr.component';
import { SupportComponent } from './support/support.component';
import { FruitDecorComponent } from './fruit-decor/fruit-decor.component';
import { ScrollRevealDirective } from './directives/scroll-reveal.directive';
import { Banner2Component } from './banner-2/banner-2.component';
import { Banner3Component } from './banner-3/banner-3.component';
import { ProductSection2Component } from './product-section-2/product-section-2.component';
import { ProductSection3Component } from './product-section-3/product-section-3.component';
import { VietnamMapComponent } from './vietnam-map/vietnam-map.component';
import { LoadingComponent } from './shared/loading/loading.component';
import { HistoryComponent } from './history/history.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { DeliveryMethodsComponent } from './delivery-methods/delivery-methods.component';
import { HowToBuyComponent } from './how-to-buy/how-to-buy.component';

@NgModule({
  declarations: [
    AppComponent,
    ProductListComponent,
    AboutUsComponent,
    BannerComponent,
    EventComponent,
    SloganComponent,
    HeaderComponent,
    ContactComponent,
    FaqComponent,
    ContactFaqComponent,
    HomepageComponent,
    FooterComponent,
    AboutComponent,
    VisionMisionComponent,
    CtaComponent,
    SlideshowComponent,
    IntroComponent,
    PolicyComponent,
    SignupComponent,
    LoginComponent,
    ProductItemComponent,
    ProductEventComponent,
    ProductDetailComponent,
    ProductDescComponent,
    RelatedProductComponent,
    ProductPageComponent,
    CartComponent,
    PaymentComponent,
    SnowfallComponent,
    MusicplayerComponent,
    TermsComponent,
    PrivacyComponent,
    BlogComponent,
    ProductCatalogComponent,
    PersonalInfoComponent,
    ChatComponent,
    QrComponent,
    SupportComponent,
    FruitDecorComponent,
    Banner2Component,
    Banner3Component,
    ProductSection2Component,
    ProductSection3Component,
    VietnamMapComponent,
    ScrollRevealDirective,
    LoadingComponent,
    HistoryComponent,
    DeliveryComponent,
    DeliveryMethodsComponent,
    HowToBuyComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    // LoadingInterceptor disabled - loading only for login/signup
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: LoadingInterceptor,
    //   multi: true
    // },
    AuthGuard
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
