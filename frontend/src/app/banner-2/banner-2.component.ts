import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-banner-2',
  templateUrl: './banner-2.component.html',
  styleUrl: './banner-2.component.css'
})
export class Banner2Component {

  constructor(private router: Router) { }

  goToTreMayProducts(): void {
    this.router.navigate(['/catalog'], { queryParams: { category: 'tre_may' } });
  }
}
