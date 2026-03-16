import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent {
  zaloId: string = environment.support.zalo.id;

  openZalo(): void {
    const zaloUrl = `https://zalo.me/${this.zaloId}`;
    window.open(zaloUrl, '_blank');
  }
}
