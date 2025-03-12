import { CoValueSchema } from "../coMap/schema.js";
import { SelfReference } from "./self.js";

export const OptionalSymbol = "Optional" as const;

export type Optional<T extends CoValueSchema<any> | SelfReference> = T & {
  [OptionalSymbol]: true;
};

type isOptional<T> = T extends {
  [OptionalSymbol]: true;
}
  ? true
  : false;

export type addOptional<T> = isOptional<T> extends true ? undefined : never;

export function optional<T extends CoValueSchema<any> | SelfReference>(
  value: T,
): Optional<T> {
  return Object.create(value, {
    [OptionalSymbol]: {
      value: true,
      writable: true,
      enumerable: false,
      configurable: false,
    },
  });
}

export function isOptional<T extends CoValueSchema<any> | SelfReference>(
  value: T,
): value is Optional<T> {
  return OptionalSymbol in value;
}
