export class Product {
  constructor(
    public _id: string,
    public product_name: string = "",
    public product_detail: string = "",
    public stocked_quantity: number = 0,
    public unit_price: number = 0,
    public discount: number = 0,
    public createdAt: string = "",
    public image_1: string = "",
    public image_2: string = "",
    public image_3: string = "",
    public image_4: string = "",
    public image_5: string = "",
    public product_dept: string = "",
    public rating: number = 4,
    public isNew: boolean = false,
    public type: string = "food"
  ) { }

  getDiscountedPrice(): number {
    return this.unit_price * (1 - this.discount);
  }

  checkIfNew(days: number = 30): boolean {
    const createdDate = new Date(this.createdAt);
    const currentDate = new Date();
    const timeDiff = Math.abs(currentDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    this.isNew = diffDays <= days;
    return this.isNew;
  }
}
