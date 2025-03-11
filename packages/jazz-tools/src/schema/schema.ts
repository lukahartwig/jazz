import { z } from "zod";
import { CoMapSchema } from "./coMap/schema.js";
import { CoMapSchemaShape } from "./coMap/schema.js";
import { Lazy } from "./coValue/lazy.js";

function map<S extends CoMapSchemaShape>(schema: S) {
  return new CoMapSchema(schema);
}

function lazy<T>(value: T) {
  return new Lazy(value);
}

export const co = {
  map,
  lazy,
};

export { z };
export type { CoMap } from "./coMap/instance.js";
export type { CoMapSchema } from "./coMap/schema.js";
export type {
  CoValue,
  RelationsToResolve,
  RelationsToResolveStrict,
  Loaded,
} from "./coValue/types.js";
