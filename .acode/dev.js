// .acode/dev.js

const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const esbuild = require("esbuild");
const { bundlePlugin, pluginMeta } = require("./build.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const DEV_DIR = path.join(ROOT_DIR, "dev");

const PORT = 1000;
const isTestMode = process.argv.includes("--test");
const pluginName = pluginMeta.name ? pluginMeta.name.replace(/[^a-zA-Z0-9_-]/g, "") : "plugin";

/**
 * Detect local IPv4 address for local network access (e.g., Acode on Android)
 */
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

function openBrowser(url) {
  const startCommand = {
    win32: `start "" "${url}"`,
    darwin: `open "${url}"`,
    linux: `xdg-open "${url}"`
  }[process.platform];

  if (startCommand) {
    exec(startCommand, (err) => {
      if (err) console.log(`ℹ️ Open preview manually at: ${url}`);
      else console.log(`🚀 Opened preview in default browser.`);
    });
  } else {
    console.log(`👉 Preview URL: ${url}`);
  }
}

async function start() {
  const localIp = getLocalIp();

  if (isTestMode) {
    // ----------------------------------------------------
    // MODE 1: DEV ZIP WATCH & LOCAL NETWORK SERVER (npm run test / dev:test)
    // ----------------------------------------------------
    console.log("🛠️ Starting Live Plugin Packager & Dev Server...\n");

    const liveZipPlugin = {
      name: "live-zip-packager",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length === 0) {
            try {
              await bundlePlugin();
              console.log(`⚡ Zip updated & ready on network: http://${localIp}:${PORT}/dist/${pluginName}.zip\n`);
            } catch (err) {
              console.error("❌ Zip bundle error:", err.message);
            }
          }
        });
      }
    };

    const ctx = await esbuild.context({
      entryPoints: [path.join(SRC_DIR, "main.js")],
      outfile: path.join(DEV_DIR, "main.js"),
      bundle: true,
      format: "iife",
      target: ["es2020"],
      plugins: [liveZipPlugin],
      logLevel: "error"
    });

    await ctx.watch();

    await ctx.serve({
      servedir: ROOT_DIR,
      host: "0.0.0.0",
      port: PORT
    });

    const zipUrl = `http://${localIp}:${PORT}/dist/${pluginName}.zip`;
    const localZipUrl = `http://localhost:${PORT}/dist/${pluginName}.zip`;

    console.log("==================================================");
    console.log(`📲 Install in Acode via URL:`);
    console.log(`   🔗 Local Network : \x1b[36m${zipUrl}\x1b[0m`);
    console.log(`   💻 Localhost     : \x1b[36m${localZipUrl}\x1b[0m`);
    console.log("==================================================");
    console.log("👀 Watching for file changes in src/...\n");
  } else {
    // ----------------------------------------------------
    // MODE 2: BROWSER TESTING SUITE (npm run dev / dev:web)
    // ----------------------------------------------------
    console.log("🛠️ Starting Acode Plugin Web Dev Server...\n");

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

    await ctx.serve({
      servedir: ROOT_DIR,
      host: "0.0.0.0",
      port: PORT
    });

    const devLocalUrl = `http://localhost:${PORT}/dev/`;
    const devNetworkUrl = `http://${localIp}:${PORT}/dev/`;

    console.log(`✅ Web Suite running at:`);
    console.log(`   💻 Local:   \x1b[36m${devLocalUrl}\x1b[0m`);
    console.log(`   🌐 Network: \x1b[36m${devNetworkUrl}\x1b[0m\n`);

    openBrowser(devLocalUrl);
  }
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});