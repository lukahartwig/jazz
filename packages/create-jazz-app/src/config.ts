export type Environment = "browser" | "mobile";
export type Engine = "browser" | "mobile" | "nodejs" | "deno" | "bun";
export type Framework = "react" | "vue" | "svelte" | "react-native-expo";
export type AuthMethod =
  | "demo"
  | "passkey"
  | "passphrase"
  | "clerk"
  | "keypair";

export type EngineConfig = {
  [K in Engine]?: {
    [F in Framework]?: {
      auth: AuthMethod[];
    };
  };
};

export type ConfigStructure = Record<Environment, EngineConfig>;

export type ValidEngine<R extends Environment> = keyof NonNullable<
  ConfigStructure[R]
>;
export type ValidFramework<
  R extends Environment,
  E extends Engine,
> = keyof NonNullable<NonNullable<ConfigStructure[R]>[E]>;
export type ValidAuth<
  R extends Environment,
  E extends Engine,
  F extends Framework,
> = NonNullable<
  NonNullable<NonNullable<ConfigStructure[R]>[E]>[F]
>["auth"][number];

export const configMap: ConfigStructure = {
  browser: {
    browser: {
      react: { auth: ["demo", "passkey", "passphrase", "clerk"] },
      vue: { auth: ["demo"] },
      svelte: { auth: ["passkey"] },
    },
  },
  mobile: {
    mobile: {
      "react-native-expo": { auth: ["demo", "clerk"] },
    },
  },
};

export type FrameworkAuthPair =
  `${ValidFramework<Environment, ValidEngine<Environment>>}-${ValidAuth<Environment, ValidEngine<Environment>, ValidFramework<Environment, ValidEngine<Environment>>>}-auth`;

export const frameworkToAuthExamples: Partial<
  Record<FrameworkAuthPair, { name: string; repo: string | undefined }>
> = {
  "react-demo-auth": {
    name: "React + Jazz + Demo Auth + Tailwind",
    repo: "garden-co/jazz/starters/react-demo-auth-tailwind",
  },
  "react-passkey-auth": {
    name: "React + Jazz + Passkey Auth",
    repo: "garden-co/jazz/examples/passkey",
  },
  "react-clerk-auth": {
    name: "React + Jazz + Clerk Auth",
    repo: "garden-co/jazz/examples/clerk",
  },
  "vue-demo-auth": {
    name: "Vue + Jazz + Demo Auth",
    repo: "garden-co/jazz/examples/todo-vue",
  },
  "svelte-passkey-auth": {
    name: "Svelte + Jazz + Passkey Auth",
    repo: "garden-co/jazz/examples/passkey-svelte",
  },
  "react-native-expo-clerk-auth": {
    name: "React Native Expo + Jazz + Clerk Auth",
    repo: "garden-co/jazz/examples/chat-rn-clerk",
  },
};

export type RuntimeEngines = typeof configMap;
export type Runtime = keyof RuntimeEngines;
