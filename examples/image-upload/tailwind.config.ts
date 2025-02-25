import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
const colors = require("tailwindcss/colors");

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: "0.75rem",
          sm: "1rem",
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) =>
      addBase({
        ":root": {
          "--gcmp-border-color": colors.stone[200],
          "--gcmp-invert-border-color": colors.stone[900],
        },
        "*": {
          borderColor: "var(--gcmp-border-color)",
        },
        "@media (prefers-color-scheme: dark)": {
          "*": {
            borderColor: "var(--gcmp-invert-border-color)",
          },
        },
        "*:focus": {
          outline: "none",
        },
      }),
    ),
  ],
} as const;

export default config;
