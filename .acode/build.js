// .acode/build.js

const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");
const JSZip = require("jszip");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PLUGIN_JSON_PATH = path.join(SRC_DIR, "plugin.json");
const CHANGELOG_PATH = path.join(SRC_DIR, "changelog.md");

if (!fs.existsSync(PLUGIN_JSON_PATH)) {
  console.error("❌ Error: src/plugin.json not found!");
  process.exit(1);
}

const pluginMeta = JSON.parse(fs.readFileSync(PLUGIN_JSON_PATH, "utf8"));
const pluginName = pluginMeta.name ? pluginMeta.name.replace(/[^a-zA-Z0-9_-]/g, "") : "plugin";
const outputZipPath = path.join(DIST_DIR, `${pluginName}.zip`);

/**
 * Validates that src/changelog.md exists and contains notes for the current version.
 * Does NOT overwrite or inject git commits automatically.
 */
function validateChangelog() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.warn("⚠️ Warning: src/changelog.md is missing. Creating an initial template...");
    const initialContent = `# Changelog\n\n## v${pluginMeta.version || "1.0.0"}\n- Initial release\n`;
    fs.writeFileSync(CHANGELOG_PATH, initialContent, "utf8");
    return;
  }

  const changelogContent = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const currentVersion = pluginMeta.version;

  // Check if version is mentioned in changelog (e.g., "1.2.0" or "v1.2.0")
  if (currentVersion && !changelogContent.includes(currentVersion)) {
    console.warn(`⚠️ Warning: Current version (v${currentVersion}) was not found in src/changelog.md.`);
    console.warn(`💡 Tip: Update src/changelog.md with your release notes before publishing.`);
  } else {
    console.log(`📄 Changelog validated for version v${currentVersion}`);
  }
}

async function bundlePlugin() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Check manual changelog
  validateChangelog();

  console.log("📦 Compiling plugin source...");
  const buildResult = await esbuild.build({
    entryPoints: [path.join(SRC_DIR, "main.js")],
    bundle: true,
    minify: true,
    write: false,
    format: "iife",
    target: ["es2020"]
  });

  const bundledCode = buildResult.outputFiles[0].text;
  const zip = new JSZip();

  // 1. Root compiled entry point inside zip
  zip.file("main.js", bundledCode);

  // 2. Plugin manifest
  zip.file("plugin.json", fs.readFileSync(PLUGIN_JSON_PATH));

  // 3. Icon
  const iconPath = path.join(SRC_DIR, "icon.png");
  if (fs.existsSync(iconPath)) {
    zip.file("icon.png", fs.readFileSync(iconPath));
  }

  // 4. Readme
  const readmePath = path.join(SRC_DIR, "readme.md");
  if (fs.existsSync(readmePath)) {
    zip.file("readme.md", fs.readFileSync(readmePath));
  }

  // 5. Changelog (Preserves developer's exact manual entries)
  if (fs.existsSync(CHANGELOG_PATH)) {
    zip.file("changelog.md", fs.readFileSync(CHANGELOG_PATH));
  }

  // 6. Extra files/ directory
  function addDirectoryToZip(currentPath, zipTarget) {
    if (!fs.existsSync(currentPath)) return;
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipTarget.folder(item);
        addDirectoryToZip(fullPath, subFolder);
      } else {
        zipTarget.file(item, fs.readFileSync(fullPath));
      }
    }
  }

  const filesDir = path.join(SRC_DIR, "files");
  if (fs.existsSync(filesDir)) {
    const filesZipFolder = zip.folder("files");
    addDirectoryToZip(filesDir, filesZipFolder);
  }

  console.log(`🗜️  Writing archive to: dist/${pluginName}.zip`);
  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });

  fs.writeFileSync(outputZipPath, content);
  console.log(`✅ Build Complete: dist/${pluginName}.zip\n`);
}

module.exports = { bundlePlugin, outputZipPath, pluginMeta };

if (require.main === module) {
  bundlePlugin().catch((err) => {
    console.error("❌ Build Failed:", err);
    process.exit(1);
  });
}