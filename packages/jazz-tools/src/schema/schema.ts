import { z } from "zod";
import { CoMapSchema } from "./coMap/schema.js";
import { CoMapSchemaShape } from "./coMap/schema.js";
import { SelfReference } from "./coValue/types.js";

function map<S extends CoMapSchemaShape>(schema: S) {
  return new CoMapSchema(schema);
}

function self() {
  return SelfReference;
}

export const co = {
  map,
  self,
};

export { z };
export type { CoMap } from "./coMap/instance.js";
export type { CoMapSchema } from "./coMap/schema.js";
export type {
  RelationsToResolve,
  RelationsToResolveStrict,
  Loaded,
} from "./coValue/types.js";
