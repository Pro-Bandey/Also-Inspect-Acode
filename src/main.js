import plugin from "./plugin.json";

const settings = acode.require("settings");

export class ErudaPlugin {
  #instance = null;
  #baseUrl = "";
  #scriptLoaded = false;

  constructor() {
    if (settings.get("developerMode") === undefined) {
      settings.update({ developerMode: false });
    }
  }

  async init(baseUrl) {
    this.#baseUrl = baseUrl ? (baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`) : "";

    // Listen to setting changes in Acode
    settings.on("update:developerMode", (val) => this.toggle(val));

    // If enabled in settings, show floating button immediately
    if (settings.get("developerMode")) {
      await this.toggle(true);
    }
  }

  async toggle(enable) {
    if (enable) {
      if (this.#instance) {
        this.#instance.show(); // Show floating icon / panel
        return;
      }

      await this.#loadScript();

      if (window.eruda) {
        this.#instance = window.eruda;

        const isDark = document.body.classList.contains("dark") || 
                       window.matchMedia("(prefers-color-scheme: dark)").matches;

        this.#instance.init({
          container: this.#getContainer(),
          useShadowDom: true,
          autoScale: true,
          defaults: {
            displaySize: 50,
            theme: isDark ? "Dark" : "Light"
          }
        });
      }
    } else {
      if (this.#instance) {
        this.#instance.destroy();
        this.#instance = null;
        document.getElementById("eruda-plugin-container")?.remove();
      }
    }
  }

  async #loadScript() {
    if (this.#scriptLoaded || window.eruda) return;

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.id = "eruda-script";
      script.src = `${this.#baseUrl}files/eruda.js`;

      script.onload = () => {
        this.#scriptLoaded = true;
        resolve();
      };

      script.onerror = () => {
        // Fallback to CDN if local bundle isn't found
        const cdnScript = document.createElement("script");
        cdnScript.id = "eruda-script";
        cdnScript.src = "https://cdn.jsdelivr.net/npm/eruda"
        cdnScript.onload = () => {
          this.#scriptLoaded = true;
          resolve();
        };
        document.head.appendChild(cdnScript);
      };

      document.head.appendChild(script);
    });
  }

  #getContainer() {
    let container = document.getElementById("eruda-plugin-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "eruda-plugin-container";
      container.style.position = "relative";
      container.style.zIndex = "999999"; // Ensure it stays on top of CodeMirror & Acode UI
      document.body.appendChild(container);
    }
    return container;
  }

  get settings() {
    return {
      list: [
        {
          key: "developerMode",
          text: "Enable Also Inspect Acode Floating DevTools",
          checkbox: !!settings.get("developerMode")
        }
      ],
      cb: (key, value) => {
        settings.update({ [key]: value });
      }
    };
  }

  async destroy() {
    settings.off("update:developerMode");
    await this.toggle(false);
    document.getElementById("eruda-script")?.remove();
    this.#scriptLoaded = false;
  }
}

if (window.acode) {
  const instance = new ErudaPlugin();

  acode.setPluginInit(
    plugin.id,
    (baseUrl) => instance.init(baseUrl),
    instance.settings
  );

  acode.setPluginUnmount(plugin.id, () => instance.destroy());
}

export default ErudaPlugin;