const path = require("path");
const { exec } = require("child_process");
const esbuild = require("esbuild");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const DEV_DIR = path.join(ROOT_DIR, "dev");

function openBrowser(url) {
  const startCommand = {
    win32: `start "" "${url}"`,
    darwin: `open "${url}"`,
    linux: `xdg-open "${url}"`
  }[process.platform];

  if (startCommand) {
    exec(startCommand, (err) => {
      if (err) console.log(`ℹ️ Open manually at: ${url}`);
      else console.log(`🚀 Launched preview in default browser.`);
    });
  } else {
    console.log(`👉 Preview URL: ${url}`);
  }
}

(async function startDev() {
  console.log("🛠️ Starting Acode Plugin Dev Server...");

  const ctx = await esbuild.context({
    entryPoints: [path.join(SRC_DIR, "main.js")],
    outfile: path.join(DEV_DIR, "main.js"),
    bundle: true,
    sourcemap: "inline",
    format: "iife",
    target: ["es2020"],
    logLevel: "info"
  });

  await ctx.watch();

  const { hosts, port } = await ctx.serve({
    servedir: ROOT_DIR,
    port: 1000
  });

  const devUrl = `http://localhost:${port}/dev/`;
  console.log(`✅ Dev Server listening at: ${devUrl}`);
  openBrowser(devUrl);
})();