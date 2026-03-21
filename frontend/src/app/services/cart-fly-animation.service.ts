import { Injectable } from '@angular/core';

const CART_ICON_SELECTOR = '[data-cart-icon]';
const FLY_DURATION_MS = 480;

@Injectable({ providedIn: 'root' })
export class CartFlyAnimationService {

  /** Trả về rect của ảnh sản phẩm từ event (nút Thêm vào giỏ). */
  getImageRectFromEvent(event: Event): DOMRect | null {
    const target = event.target as HTMLElement;
    const card = target.closest('.product-card') || target.closest('.product-details-container');
    if (!card) return null;
    const img = card.querySelector('.product-image img, .main-image, img.card-img-top');
    return (img as HTMLElement)?.getBoundingClientRect() ?? null;
  }

  /**
   * Tạo hiệu ứng ảnh thu nhỏ bay vào icon giỏ hàng.
   * @param imageUrl URL ảnh sản phẩm
   * @param sourceRect vị trí/kích thước ô ảnh (từ getBoundingClientRect)
   */
  flyToCart(imageUrl: string, sourceRect: DOMRect): void {
    const cartEl = document.querySelector(CART_ICON_SELECTOR) as HTMLElement;
    if (!cartEl || !sourceRect.width) return;

    const cartRect = cartEl.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'cart-fly-image';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    fly.appendChild(img);
    document.body.appendChild(fly);
    const w = sourceRect.width;
    const h = sourceRect.height;
    fly.style.cssText = `
      position: fixed;
      left: ${sourceRect.left}px;
      top: ${sourceRect.top}px;
      width: ${w}px;
      height: ${h}px;
      z-index: 99999;
      pointer-events: none;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: none;
    `;
    img.style.cssText = `width: 100%; height: 100%; object-fit: cover; display: block;`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const endX = cartRect.left + cartRect.width / 2;
        const endY = cartRect.top + cartRect.height / 2;
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;
        fly.style.transition = `transform ${FLY_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        fly.style.transform = `translate(${endX - startX}px, ${endY - startY}px) scale(0.15)`;
        fly.style.opacity = '0.9';
        setTimeout(() => fly.remove(), FLY_DURATION_MS + 50);
      });
    });
  }
}
