import { Discount, DiscountValidated } from "../../domain/models/discount/Discount";
import { Discount as DiscountDto } from "../dto/Discount";

export class DiscountSerializer {
  static serialize(discount: Discount): DiscountDto {
    return {
      promocode_name: discount.name,
      advantage: discount.advantage,
      restrictions: discount.restrictions,
    };
  }

  static serializeValidate(discount: Discount, result: DiscountValidated): DiscountDto {
    return {
      promocode_name: discount.name,
      advantage: result.success ? discount.advantage : undefined,
      status: result.success ? "accepted" : "denied",
      reasons: result.success ? undefined : result.failures.map((f) => `${f.path} ${f.operator} ${f.actual} (expected: ${f.expected})`),
    };
  }
}
