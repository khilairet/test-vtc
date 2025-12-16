import { randomUUID } from "node:crypto";

export type Id = string;

export namespace Id {
  export function create(): Id {
    return randomUUID();
  }

  export function isValid(data: unknown): data is Id {
    return typeof data === "string";
  }
}
