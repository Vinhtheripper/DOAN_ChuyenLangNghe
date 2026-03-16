import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-snowfall',
  templateUrl: './snowfall.component.html',
  styleUrls: ['./snowfall.component.css']
})
export class SnowfallComponent implements OnInit, OnDestroy {
  private snowflakeInterval: any;

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {
    this.snowflakeInterval = setInterval(() => this.createSnowflake(), 300);

    setTimeout(() => {
      clearInterval(this.snowflakeInterval);
    }, 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.snowflakeInterval);
  }

  createSnowflake(): void {
    const snowflake = this.renderer.createElement('div');
    this.renderer.addClass(snowflake, 'snowflake');

    const snowflakeShapes = ['❅', '❆', '❄', '✻', '✼'];
    snowflake.innerHTML = snowflakeShapes[Math.floor(Math.random() * snowflakeShapes.length)];

    snowflake.style.left = `${Math.random() * 100}vw`;
    const size = Math.random() * 10 + 10;
    snowflake.style.fontSize = `${size}px`;

    const duration = Math.random() * 5 + 3;
    snowflake.style.animationDuration = `${duration}s`;

    snowflake.style.opacity = `${Math.random() * 0.7 + 0.3}`;

    this.renderer.appendChild(document.querySelector('.snowflake-container'), snowflake);

    snowflake.addEventListener('animationend', () => {
      this.renderer.removeChild(document.querySelector('.snowflake-container'), snowflake);
    });
  }
}
