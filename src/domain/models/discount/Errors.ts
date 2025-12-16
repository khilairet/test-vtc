export class DiscountNotFoundError extends Error {
  constructor(public readonly discountName: string) {
    super(`Discount not found: ${discountName}`);
    this.name = "DiscountNotFoundError";
  }
}