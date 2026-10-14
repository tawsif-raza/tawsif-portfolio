import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import React from "react";
import { renderToString } from "react-dom/server";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const DIST_INDEX = resolve(ROOT_DIR, "dist", "index.html");
const SSR_OUT_DIR = resolve(ROOT_DIR, "dist", ".ssr");

async function prerender() {
  // 1. Compile App.jsx and its component tree into a temporary Node SSR bundle.
  //    Bundling gsap/framer-motion via noExternal avoids Node ESM subpath errors
  //    (such as "gsap/ScrollTrigger" without a .js extension).
  await build({
    configFile: false,
    root: ROOT_DIR,
    logLevel: "warn",
    plugins: [react()],
    ssr: {
      noExternal: [
        "gsap",
        "framer-motion",
        "lucide-react",
        "@react-three/fiber",
        "three",
      ],
    },
    build: {
      ssr: resolve(ROOT_DIR, "src", "App.jsx"),
      outDir: SSR_OUT_DIR,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: "App.mjs",
        },
      },
    },
  });

  try {
    // 2. Import the compiled SSR bundle (pathToFileURL is required on Windows)
    //    and render <App initialIntroDone={true} /> to static HTML.
    const ssrBundleUrl = pathToFileURL(resolve(SSR_OUT_DIR, "App.mjs")).href;
    const { default: App } = await import(ssrBundleUrl);
    const appHtml = renderToString(
      React.createElement(App, { initialIntroDone: true })
    );

    // 3. Inject the prerendered HTML into dist/index.html.
    const indexHtml = readFileSync(DIST_INDEX, "utf-8");
    const target = '<div id="root"></div>';

    if (!indexHtml.includes(target)) {
      throw new Error(`Could not find ${target} in dist/index.html`);
    }

    const outputHtml = indexHtml.replace(
      target,
      `<div id="root">${appHtml}</div>`
    );

    writeFileSync(DIST_INDEX, outputHtml, "utf-8");
    console.log(
      `[prerender] injected ${appHtml.length.toLocaleString()} chars of static HTML into dist/index.html`
    );
  } finally {
    // 4. Always remove the temporary SSR bundle so dist/ stays clean for deploy.
    rmSync(SSR_OUT_DIR, { recursive: true, force: true });
  }
}

prerender();