import { ZodTypeAny, z } from "zod";
import { CoMapSchema } from "./coMap/schema.js";
import { CoMapSchemaShape } from "./coMap/schema.js";
import { SelfReference } from "./coValue/types.js";

function map<S extends CoMapSchemaShape>(schema: S) {
  return new CoMapSchema(schema);
}

export function isRelationRef(
  descriptor: CoMapSchema<any> | ZodTypeAny | SelfReference,
): descriptor is CoMapSchema<any> | SelfReference {
  return descriptor instanceof CoMapSchema || descriptor === SelfReference;
}

export const co = {
  map,
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  object: z.object,
  union: z.union,
  intersection: z.intersection,
  tuple: z.tuple,
  self: () => SelfReference,
};
