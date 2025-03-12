import { z } from "zod";
import { CoMapSchema } from "./coMap/schema.js";
import { CoMapSchemaShape } from "./coMap/schema.js";
import { optional } from "./coValue/optional.js";
import { self } from "./coValue/self.js";

function map<S extends CoMapSchemaShape>(schema: S) {
  return new CoMapSchema(schema);
}

export const co = {
  map,
  self,
  optional,
};

export { z };
export type { CoMap } from "./coMap/instance.js";
export type { CoMapSchema } from "./coMap/schema.js";
export type {
  RelationsToResolve,
  RelationsToResolveStrict,
  Loaded,
} from "./coValue/types.js";
