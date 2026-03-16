import { Product } from './Product';

export class Order {
  constructor(
    public _id: string | null = null,
    public userId: string = "",
    public userName: string = "Anonymous",
    public items: {
      product: Product;
      quantity: number;
    }[] = [],
    public totalPrice: number = 0,
    public address: {
      street: string;
      province: string;
      district: string;
      ward: string;
    } = { street: "", province: "", district: "", ward: "" },
    public contact: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
    } = { firstName: "", lastName: "", phone: "", email: "" },
    public additionalNotes: string = "",
    public paymentMethod: string = "cash_on_delivery",
    public createdAt: Date = new Date(),
    public status: string = "pending"
  ) { }
}
