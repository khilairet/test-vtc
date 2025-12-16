import { Discount, DiscountAdvantage, DiscountRestrictions } from "../domain/models/discount/Discount";

export interface CreateDiscountParams {
  name: string;
  advantage: DiscountAdvantage;
  restrictions: DiscountRestrictions[];
}

export interface GetDiscountParams {
  name: string;
}

export interface ValidateDiscountParams {
  age?: number;
  town?: string;
}

/**
 * Discount service interface
 */
export interface DiscountService {
  /**
   * Get a discount by name
   * @param params
   * @returns Discount or null if not found
   */
  getOneByName(params: GetDiscountParams): Promise<Discount | null>;

  /**
   * Validate a discount with given parameters
   * @param discount
   * @param params
   * @returns
   */
  validate(discount: Discount, params: ValidateDiscountParams): Promise<DiscountValidated>;

  /**
   * Create a new discount
   * @param params
   * @returns
   */
  create(params: CreateDiscountParams): Promise<Discount>;
}
