import { Entity, ParamsConstructEntity } from "./Entity";
import { Id } from "./Id";

export abstract class AggregateRoot extends Entity {
  protected _id: Id | undefined;
  protected readonly _createdAt: Date | undefined;
  protected readonly _updatedAt: Date | undefined;

  protected constructor(id: Id, params: ParamsConstructEntity) {
    super(id, params);
  }

  public equals(data: AggregateRoot): boolean {
    return data instanceof AggregateRoot && data.id === this._id;
  }
}
