// .acode/publish.js

const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { bundlePlugin, outputZipPath, pluginMeta } = require("./build.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env");
const SESSION_CACHE_PATH = path.join(__dirname, ".session.json");

const BASE_URL = "https://acode.app";
const LOGIN_API_URL = `${BASE_URL}/api/login`;
const PLUGIN_API_URL = `${BASE_URL}/api/plugin`;

/**
 * Lightweight built-in .env parser (No external dependencies needed)
 */
function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, "utf8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

// Load .env at startup
loadEnv();

/**
 * Interactive prompt helper for CLI input
 */
function promptInput(question, isPassword = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    if (isPassword) {
      process.stdout.write(question);
      let password = "";
      
      const onData = (char) => {
        char = char.toString("utf8");
        switch (char) {
          case "\n":
          case "\r":
          case "\u0004":
            process.stdin.removeListener("data", onData);
            break;
          case "\u0008":
          case "\x7f":
            if (password.length > 0) {
              password = password.slice(0, -1);
            }
            break;
          default:
            password += char;
            break;
        }
      };

      process.stdin.on("data", onData);
      rl.question("", () => {
        rl.close();
        console.log();
        resolve(password.trim());
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Helper to parse raw Set-Cookie headers into a valid Cookie header string and dictionary
 */
function parseCookies(response) {
  let rawCookies = [];
  if (typeof response.headers.getSetCookie === "function") {
    rawCookies = response.headers.getSetCookie();
  } else {
    const header = response.headers.get("set-cookie");
    if (header) rawCookies = [header];
  }

  const cookieMap = {};
  for (const raw of rawCookies) {
    const parts = raw.split(";");
    const [pair] = parts;
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const key = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      cookieMap[key] = val;
    }
  }

  const cookieHeader = Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return { cookieMap, cookieHeader };
}

/**
 * Authenticate with Acode Account
 */
async function login(email, password) {
  try {
    console.log(`🔐 Authenticating as ${email}...`);
    const response = await fetch(LOGIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": BASE_URL,
        "Referer": `${BASE_URL}/login`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: JSON.stringify({ email, password })
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`❌ Login failed [HTTP ${response.status}]:`, responseBody.message || responseBody);
      return null;
    }

    const { cookieMap, cookieHeader } = parseCookies(response);

    if (!cookieMap.token && !cookieHeader) {
      console.error("❌ Authentication succeeded but session cookies were missing.");
      return null;
    }

    const csrfToken =
      cookieMap["_csrf"] ||
      cookieMap["csrfToken"] ||
      cookieMap["xsrf-token"] ||
      cookieMap["XSRF-TOKEN"] ||
      responseBody.csrfToken ||
      responseBody.csrf ||
      cookieMap.token;

    const session = { cookieHeader, csrfToken };

    // Cache session locally to avoid logging in on immediate next builds
    try {
      fs.writeFileSync(SESSION_CACHE_PATH, JSON.stringify(session, null, 2), "utf8");
    } catch (_) {}

    console.log("✅ Authenticated successfully.");
    return session;
  } catch (error) {
    console.error("❌ Login error:", error.message);
    return null;
  }
}

/**
 * Upload the plugin zip to Acode Store
 */
async function upload(authSession) {
  console.log(`🚀 Uploading ${pluginMeta.id || pluginMeta.name} (v${pluginMeta.version}) to Acode...`);

  const fileBuffer = fs.readFileSync(outputZipPath);
  const blob = new Blob([fileBuffer], { type: "application/zip" });

  const formData = new FormData();
  formData.append("plugin", blob, path.basename(outputZipPath));

  const headers = {
    "Cookie": authSession.cookieHeader,
    "Origin": BASE_URL,
    "Referer": `${BASE_URL}/`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  };

  if (authSession.csrfToken) {
    headers["x-csrf-token"] = authSession.csrfToken;
    headers["x-xsrf-token"] = authSession.csrfToken;
  }

  try {
    const response = await fetch(PLUGIN_API_URL, {
      method: "PUT",
      headers: headers,
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log("🎉 Plugin published/updated successfully!");
      console.log(result);
      return true;
    } else {
      console.error(`❌ Upload failed [HTTP ${response.status}]:`, result.message || result);
      return false;
    }
  } catch (error) {
    console.error("❌ Upload execution error:", error.message);
    return false;
  }
}

/**
 * Main publish pipeline
 */
async function publish() {
  console.log(`🔍 Checking package bundle: ${outputZipPath}`);

  if (!fs.existsSync(outputZipPath)) {
    console.log("⚠️ Bundle not found in dist/. Generating fresh build...");
    await bundlePlugin();
  }

  // 1. Try cached session first
  if (fs.existsSync(SESSION_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(SESSION_CACHE_PATH, "utf8"));
      if (cached && cached.cookieHeader) {
        console.log("⚡ Using cached login session...");
        const success = await upload(cached);
        if (success) return;
        console.log("🔄 Cached session expired or invalid. Re-authenticating...");
      }
    } catch (_) {}
  }

  // 2. Load credentials from process.env / .env
  let email = process.env.ACODE_EMAIL;
  let password = process.env.ACODE_PASSWORD || process.env.ACODE_PASSWORLD;
  let prompted = false;

  if (!email) {
    email = await promptInput("📧 Enter your Acode account email: ");
    prompted = true;
  }
  if (!password) {
    password = await promptInput("🔑 Enter your Acode account password: ", true);
    prompted = true;
  }

  if (!email || !password) {
    console.error("❌ Error: Both email and password are required to publish.");
    process.exit(1);
  }

  // 3. Option to save to .env if entered manually
  if (prompted) {
    const saveChoice = await promptInput("💾 Save credentials to .env file for future publishes? (y/N): ");
    if (saveChoice.toLowerCase() === "y" || saveChoice.toLowerCase() === "yes") {
      const envEntry = `\nACODE_EMAIL=${email}\nACODE_PASSWORD=${password}\n`;
      fs.appendFileSync(ENV_PATH, envEntry, "utf8");
      console.log("✅ Credentials saved to .env (ignored by git).");
    }
  }

  const authSession = await login(email, password);
  if (authSession) {
    await upload(authSession);
  } else {
    process.exit(1);
  }
}

publish();