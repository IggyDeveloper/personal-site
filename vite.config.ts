import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Allow for wgsl shaders to be imported as modules
    {
      name: "wgsl-loader",
      transform(code, id) {
        if (id.endsWith(".wgsl")) {
          return `export default ${JSON.stringify(code)};`;
        }
      },
    },
  ],
});
