import { CoValueSchema } from "../coMap/schema.js";
import { optional } from "./optional.js";

export const SelfReferenceSymbol = "SelfReference" as const;

export type SelfReference = {
  [SelfReferenceSymbol]: true;
};

export type markSelfReferenceAsOptional<T> = T extends SelfReference
  ? undefined
  : never;

export function self() {
  // Self references are always optional
  const selfRef: SelfReference = optional({
    [SelfReferenceSymbol]: true,
  });

  return selfRef;
}

export function isSelfReference(value: unknown): value is SelfReference {
  return (
    typeof value === "object" && value !== null && SelfReferenceSymbol in value
  );
}
