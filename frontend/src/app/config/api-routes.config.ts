export const API_ROUTE_PREFIXES = [
  '/products',
  '/user',
  '/orders',
  '/feedback',
  '/cart',
  '/blogs',
  '/dashboard',
  '/coupons',
  '/uploads',
  '/health'
];

export function isApiRequest(url: string): boolean {
  return API_ROUTE_PREFIXES.some((prefix) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`));
}
