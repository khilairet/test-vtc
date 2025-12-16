export interface Discount {
  promocode_name: string;
  restrictions?: any[];
  advantage?: { percent?: number; amount?: number };
  status?: string;
  reasons?: string[];
}

export interface ValidateDiscountParams {
  promocode_name: string;
  arguments?: {
    age?: number;
    town?: string;
  };
}
