import { DiscountRepository } from "../../../application/repositories/DiscountRepository";
import { Discount } from "../../../domain/models/discount/Discount";

export class MemoryDiscountRepository implements DiscountRepository {
  private items: Discount[];

  constructor() {
    this.items = [];
  }

  async findOneByName(name: string): Promise<Discount | null> {
    return this.items.find((d) => d.name === name) ?? null;
  }

  async create(discount: Discount): Promise<Discount> {
    this.items.push(discount);
    return discount;
  }
}
