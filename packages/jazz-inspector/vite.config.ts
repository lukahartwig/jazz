import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import depsExternal from "rollup-plugin-node-externals";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), depsExternal(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/app.tsx"),
      name: "JazzInspector",
      // the proper extensions will be added
      fileName: "jazz-inspector",
      formats: ["es"],
    },
  },
});
