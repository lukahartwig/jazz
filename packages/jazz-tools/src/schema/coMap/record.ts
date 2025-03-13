import { ZodString } from "zod";
import { CoMapSchema, CoMapSchemaField } from "./schema.js";

export const RecordSymbol = "$$record$$";
export type RecordSymbol = typeof RecordSymbol;

export type RecordDefinition<
  K extends ZodString,
  V extends CoMapSchemaField,
> = {
  key: K;
  value: V;
};

export type IsRecord<T extends CoMapSchema<any>> =
  T["shape"][typeof RecordSymbol] extends RecordDefinition<any, any>
    ? true
    : false;
