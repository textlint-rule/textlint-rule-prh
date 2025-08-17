import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: ["./src/node.ts"],
        platform: "node",
        dts: true,
        format: ["cjs", "esm"]
    },
    {
        entry: ["./src/browser.ts"],
        platform: "browser",
        dts: true
    }
]);
