import { Id } from "./Id";

export interface ParamsConstructEntity {
  id?: Id;
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class Entity {
  public readonly id: Id;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(id: Id, params: ParamsConstructEntity) {
    this.id = id;
    this.createdAt = params.createdAt instanceof Date ? params.createdAt : new Date();
    this.updatedAt = params.updatedAt instanceof Date ? params.updatedAt : new Date();
  }

  public equals(object?: Entity): boolean {
    return object instanceof Entity && object.id === this.id;
  }
}
