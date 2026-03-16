export interface CartItem {
  productId: string | null;
  quantity: number;
  unit_price: number;
  product_name: string;
  image_1: string;
  stocked_quantity: number;
  userId?: string;
}
