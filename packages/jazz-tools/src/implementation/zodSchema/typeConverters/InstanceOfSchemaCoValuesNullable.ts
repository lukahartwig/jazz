import {
  Account,
  AnyCoFeedSchema,
  AnyCoListSchema,
  AnyCoMapSchema,
  CoFeed,
  CoList,
  CoMap,
  CoPlainText,
  CoRichText,
  CoValueClass,
  FileStream,
} from "../../../internal.js";
import { FileStreamSchema } from "../schemaTypes/FileStreamSchema.js";
import { PlainTextSchema } from "../schemaTypes/PlainTextSchema.js";
import { RichTextSchema } from "../schemaTypes/RichTextSchema.js";
import { z } from "../zodReExport.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "./InstanceOrPrimitiveOfSchemaCoValuesNullable.js";

export type InstanceOfSchemaCoValuesNullable<
  S extends CoValueClass | z.core.$ZodType,
> = S extends z.core.$ZodType
  ? S extends z.core.$ZodObject<infer Shape> & {
      collaborative: true;
      builtin: "Account";
    }
    ?
        | ({
            [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
              Shape[key]
            >;
          } & Account)
        | null
    : S extends z.core.$ZodRecord<infer K, infer V> & {
          collaborative: true;
        }
      ?
          | ({
              [key in z.output<K> &
                string]: InstanceOrPrimitiveOfSchemaCoValuesNullable<V>;
            } & CoMap)
          | null
      : S extends AnyCoMapSchema<infer Shape, infer Config>
        ?
            | ({
                [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
                  Shape[key]
                >;
              } & (unknown extends Config["out"][string]
                ? {}
                : {
                    [key: string]: Config["out"][string];
                  }) &
                CoMap)
            | null
        : S extends AnyCoListSchema<infer T>
          ? CoList<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>> | null
          : S extends AnyCoFeedSchema<infer T>
            ? CoFeed<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>> | null
            : S extends PlainTextSchema
              ? CoPlainText | null
              : S extends RichTextSchema
                ? CoRichText | null
                : S extends FileStreamSchema
                  ? FileStream | null
                  : S extends z.core.$ZodOptional<infer Inner>
                    ?
                        | InstanceOrPrimitiveOfSchemaCoValuesNullable<Inner>
                        | undefined
                    : S extends z.core.$ZodUnion<infer Members>
                      ? InstanceOrPrimitiveOfSchemaCoValuesNullable<
                          Members[number]
                        >
                      : never
  : S extends CoValueClass
    ? InstanceType<S> | null
    : never;
