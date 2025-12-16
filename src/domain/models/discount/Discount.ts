import { JSONCondition } from "../../shared/JsonCondition";
import { AggregateRoot } from "../AggregateRoot";
import { ParamsConstructEntity } from "../Entity";
import { Id } from "../Id";

export interface DiscountAdvantage {
  percent?: number;
  amount?: number;
}

export interface DiscountRestrictions {
  data?: {
    before?: Date;
    after?: Date;
  };
  age?: {
    eq?: number;
    lt?: number;
    gt?: number;
  };
  weather?: {
    is: string;
    temp: {
      lt?: number;
      gt?: number;
    };
  };
}

export interface DiscountValidated {
  success: boolean;
  failures: {
    path: string;
    operator: string;
    expected: any;
    actual: any;
  }[];
}

export interface DiscountConstructorParams extends ParamsConstructEntity {
  name: string;
  advantage: DiscountAdvantage;
  restrictions?: DiscountRestrictions[];
}

export class Discount extends AggregateRoot {
  private _state: {
    name: string;
    advantage: DiscountAdvantage;
    restrictions: any[];
  };

  constructor(params: DiscountConstructorParams) {
    const id = params.id && Id.isValid(params.id) ? params.id : Id.create();
    super(id, params);

    this._state = {
      name: params.name,
      advantage: params.advantage,
      restrictions: params.restrictions ?? [],
    };
    Object.freeze(this);
  }

  public validated(value: any): DiscountValidated {
    return JSONCondition.resolve(this.restrictions, value);
  }

  public static isValid(data: unknown): data is Discount {
    return data instanceof Discount;
  }

  get name(): string {
    return this._state.name;
  }

  set name(value: string) {
    this._state.name = value;
    this.updatedAt = new Date();
  }

  get advantage(): DiscountAdvantage {
    return this._state.advantage;
  }

  set advantage(value: DiscountAdvantage) {
    this._state.advantage = value;
    this.updatedAt = new Date();
  }

  get restrictions(): any[] {
    return this._state.restrictions;
  }

  set restrictions(value: any[]) {
    this._state.restrictions = value ?? [];
    this.updatedAt = new Date();
  }
}
