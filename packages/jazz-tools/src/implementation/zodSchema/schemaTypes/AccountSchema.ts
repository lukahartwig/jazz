import { CryptoProvider } from "cojson";
import z from "zod/v4";
import {
  Account,
  Group,
  RefsToResolveStrict,
  Simplify,
} from "../../../internal.js";
import { AnonymousJazzAgent } from "../../anonymousJazzAgent.js";
import { InstanceOrPrimitiveOfSchema } from "../typeConverters/InstanceOrPrimitiveOfSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "../typeConverters/InstanceOrPrimitiveOfSchemaCoValuesNullable.js";
import { Loaded, ResolveQuery } from "../zodSchema.js";
import {
  AnyCoMapSchema,
  CoMapInitZod,
  CoMapInstance,
  CoMapSchema,
} from "./CoMapSchema.js";

export type AccountSchema<
  Shape extends {
    profile: AnyCoMapSchema<{
      name: z.core.$ZodString<string>;
      inbox?: z.core.$ZodOptional<z.core.$ZodString>;
      inboxInvite?: z.core.$ZodOptional<z.core.$ZodString>;
    }>;
    root: AnyCoMapSchema;
  } = {
    profile: CoMapSchema<{
      name: z.core.$ZodString<string>;
      inbox?: z.core.$ZodOptional<z.core.$ZodString>;
      inboxInvite?: z.core.$ZodOptional<z.core.$ZodString>;
    }>;
    root: CoMapSchema<{}>;
  },
> = Omit<CoMapSchema<Shape>, "create" | "load"> & {
  builtin: "Account";

  create: (options: {
    creationProps?: { name: string };
    crypto?: CryptoProvider;
  }) => Promise<AccountInstance<Shape>>;

  load: <R extends ResolveQuery<AccountSchema<Shape>>>(
    id: string,
    options?: {
      loadAs?: Account | AnonymousJazzAgent;
      resolve?: RefsToResolveStrict<AccountSchema<Shape>, R>;
    },
  ) => Promise<Loaded<AccountSchema<Shape>, R> | null>;

  createAs: (
    as: Account,
    options: {
      creationProps?: { name: string };
    },
  ) => Promise<AccountInstance<Shape>>;

  getMe: () => AccountInstanceCoValuesNullable<Shape>;

  withMigration(
    migration: (
      account: InstanceOrPrimitiveOfSchema<AccountSchema<Shape>>,
      creationProps?: { name: string },
    ) => void,
  ): AccountSchema<Shape>;
};

export type DefaultProfileShape = {
  name: z.core.$ZodString<string>;
  inbox: z.core.$ZodOptional<z.core.$ZodString>;
  inboxInvite: z.core.$ZodOptional<z.core.$ZodString>;
};

export type CoProfileSchema<
  Shape extends z.core.$ZodLooseShape = DefaultProfileShape,
> = Omit<CoMapSchema<Shape & DefaultProfileShape>, "create"> & {
  create: (
    init: Simplify<CoMapInitZod<Shape & DefaultProfileShape>>,
    options: { owner: Exclude<Group, Account> } | Exclude<Group, Account>,
  ) => CoMapInstance<Shape & Simplify<DefaultProfileShape>>;
};

// less precise verion to avoid circularity issues and allow matching against
export type AnyAccountSchema<
  Shape extends z.core.$ZodLooseShape = z.core.$ZodLooseShape,
> = z.core.$ZodObject<Shape> & {
  collaborative: true;
  builtin: "Account";
};

export type AccountInstance<Shape extends z.core.$ZodLooseShape> = {
  -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchema<Shape[key]>;
} & Account;

export type AccountInstanceCoValuesNullable<
  Shape extends z.core.$ZodLooseShape,
> = {
  -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
    Shape[key]
  >;
} & Account;
