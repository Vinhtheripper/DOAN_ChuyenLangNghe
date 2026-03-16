import { Component } from '@angular/core';

@Component({
  selector: 'app-fruit-decor',
  templateUrl: './fruit-decor.component.html',
  styleUrls: ['./fruit-decor.component.css']
})
export class FruitDecorComponent {
  fruits = [
    { src: 'assets/icondecor.png', alt: 'Dưa hấu', class: 'fruit-1' },
    { src: 'assets/icondecor2.png', alt: 'Chuối', class: 'fruit-2' },
    { src: 'assets/icondecor3.png', alt: 'Cam', class: 'fruit-3' },
    { src: 'assets/icondecor4.png', alt: 'Dâu tây', class: 'fruit-4' }
  ];
}


