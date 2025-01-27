type Optionable = { optional<S extends Schema>(this: S): Optional<S> };

type StringPrimitive = { ["~type"]: "string" } & Optionable;
type NumberPrimitive = { ["~type"]: "number" } & Optionable;
type BooleanPrimitive = { ["~type"]: "boolean" } & Optionable;
type NullPrimitive = { ["~type"]: "null" } & Optionable;
type LiteralPrimitive<T extends string | number | boolean | null> = {
  ["~type"]: "literal";
  value: T;
} & Optionable;

type PrimitiveSchema =
  | StringPrimitive
  | NumberPrimitive
  | BooleanPrimitive
  | NullPrimitive
  | LiteralPrimitive<any>;
type JSONSchema =
  | PrimitiveSchema
  | ArraySchema<any>
  | ObjectSchema<any>
  | Encoded<any>;

type Encoded<T> = {
  ["~type"]: "encoded";
  encode: (value: T) => JSONSchema;
  decode: (value: JSONSchema) => T;
} & Optionable;
type EncodedDate = Encoded<Date>;

type ArraySchema<S extends JSONSchema> = {
  ["~type"]: "array";
  items: S;
} & Optionable;
type ObjectSchema<S extends { [key: string]: JSONSchema }> = {
  ["~type"]: "object";
  entries: S;
} & Optionable;

type Union<Ss extends Schema[]> = {
  ["~type"]: "union";
  schemas: Ss;
} & Optionable;
type Optional<S extends Schema> = Union<[S, NullPrimitive]>;

type CoMapDef<E extends { [key: string]: Schema }> = {
  ["~type"]: "comap";
  ["~entries"]: E;
};

type CoMap<E extends { [key: string]: Schema }> = CoMapDef<E> & {
  create(init: E): Loaded<CoMap<E>>;
} & Optionable;

type CoListDef<I extends Schema> = {
  ["~type"]: "colist";
  ["~items"]: I;
};

type CoList<I extends Schema> = CoListDef<I> & {
  create(init: I[]): Loaded<CoList<I>>;
} & Optionable;

type CoValue = CoMapDef<any> | CoListDef<any>;
type Schema = CoValue | JSONSchema | Union<Schema[]>;

const j = {
  string(): StringPrimitive {
    return { ["~type"]: "string" };
  },
  number(): NumberPrimitive {
    return { ["~type"]: "number" };
  },
  boolean(): BooleanPrimitive {
    return { ["~type"]: "boolean" };
  },
  date(): EncodedDate {
    return {
      ["~type"]: "encoded",
      encode: (value) => value.toISOString(),
      decode: (value) => new Date(value),
    };
  },
  literal<T extends string | number | boolean | null>(
    value: T,
  ): LiteralPrimitive<T> {
    return { ["~type"]: "literal", value };
  },
  array<I extends JSONSchema>(items: I): ArraySchema<I> {
    return { ["~type"]: "array", items };
  },
  object<E extends { [key: string]: JSONSchema }>(entries: E): ObjectSchema<E> {
    return { ["~type"]: "object", entries };
  },
  coMap<E extends { [key: string]: Schema }>(entries: E): CoMap<E> {
    return { ["~type"]: "comap", ["~entries"]: entries };
  },
  coList<I extends Schema>(items: I): CoList<I> {
    return { ["~type"]: "colist", ["~items"]: items };
  },
  optional<S extends Schema>(schema: S): Optional<S> {
    return { ["~type"]: "union", schemas: [schema, j.literal(null)] };
  },
};

const ImageDef = j.coMap({
  originalResolution: j.string(),
});

const Message = j.coMap({
  name: j.string(),
  image: ImageDef,
});

const Chat = j.coMap({
  messages: j.coList(Message),
});

const Root = j.coMap({
  myChats: j.coList(Chat),
});

type InferJSON<T extends JSONSchema> = T extends Encoded<infer T>
  ? T
  : T extends LiteralPrimitive<infer T>
    ? T
    : T extends StringPrimitive
      ? string
      : T extends NumberPrimitive
        ? number
        : T extends BooleanPrimitive
          ? boolean
          : T extends NullPrimitive
            ? null
            : T extends LiteralPrimitive<infer L>
              ? L
              : T extends ArraySchema<infer I>
                ? Loaded<I>[]
                : T extends ObjectSchema<infer E>
                  ? { [K in keyof E]: Loaded<E[K]> }
                  : never;

type Loaded<T extends Schema> = T extends CoMapDef<infer E>
  ? { [K in keyof E]: Loaded<E[K]> }
  : T extends CoListDef<infer I>
    ? Loaded<I>[]
    : // T extends Union<infer Ss> ? Loaded<Ss[number]> :
      T extends JSONSchema
      ? InferJSON<T>
      : never;

type R = Loaded<typeof Root>;

const r = Root.create({});
