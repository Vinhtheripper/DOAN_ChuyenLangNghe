import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-musicplayer',
  templateUrl: './musicplayer.component.html',
  styleUrls: ['./musicplayer.component.css']
})
export class MusicplayerComponent implements OnInit, OnDestroy {
  private audio!: HTMLAudioElement;
  private routerSubscription!: Subscription;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.audio = document.getElementById('background-music') as HTMLAudioElement;

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const baseUrl = event.urlAfterRedirects.split('#')[0];
        if (this.shouldPlayMusic(baseUrl)) {
          this.startAudio();
        } else {
          this.stopAudio();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
    this.stopAudio();
  }

  private startAudio(): void {
    if (this.audio.paused) {
      this.audio.muted = false;
      this.audio.play().catch(() => { });
    }
  }

  private stopAudio(): void {
    if (!this.audio.paused) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  private shouldPlayMusic(url: string): boolean {
    if (url === '/' || url.startsWith('/product')) {
      return true;
    }
    if (url === '/catalog') {
      return true;
    }
    return false;
  }
}
