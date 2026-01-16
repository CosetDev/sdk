import glob from "fast-glob";
import { execSync } from "child_process";
import { build, BuildOptions } from "esbuild";
import esbuildPluginTsc from "esbuild-plugin-tsc";

async function generateTypes() {
    try {
        execSync("tsc --p tsconfig.build.json", { stdio: "inherit" });
    } catch (error) {
        console.error("Error generating type declarations:", error);
        process.exit(1);
    }
}

generateTypes();
(async () => {
    const files = await glob(["src/**/*.ts"], { ignore: ["**/*.d.ts"] });

    const entryPoints = files.map(file => ({
        in: file,
        out: file.replace(/^src\//, "").replace(/\.ts$/, ""),
    }));

    const buildOptions: BuildOptions = {
        bundle: false,
        minify: true,
        sourcemap: true,
        logLevel: "error",
        globalName: "CosetSDK",
        entryPoints,
        plugins: [
            esbuildPluginTsc({
                force: true,
            }),
        ],
    };

    await build(
        Object.assign(buildOptions, {
            format: "esm",
            platform: "browser",
            outdir: "dist/esm",
        }) as BuildOptions
    ).catch(() => process.exit(1));

    await build(
        Object.assign(buildOptions, {
            format: "cjs",
            platform: "node",
            outdir: "dist/cjs",
            outExtension: {
                ".js": ".cjs",
            },
        }) as BuildOptions
    ).catch(() => process.exit(1));
})();
