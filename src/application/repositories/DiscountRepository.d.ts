import { Discount } from "../../domain/models/discount/Discount";

export interface DiscountRepository {
  findOneByName(name: string): Promise<Discount | null>;
  create(discount: Discount): Promise<Discount>;
}