// Utility for loading legacy scripts sequentially

export interface ScriptConfig {
  src: string;
  async?: boolean;
  defer?: boolean;
}

/**
 * Load a single script and return a promise
 */
export function loadScript(config: ScriptConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${config.src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = config.src;
    script.async = config.async ?? false;
    script.defer = config.defer ?? false;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${config.src}`));

    document.head.appendChild(script);
  });
}

/**
 * Load multiple scripts sequentially (respecting dependency order)
 */
export async function loadScriptsSequentially(scripts: ScriptConfig[]): Promise<void> {
  for (const script of scripts) {
    await loadScript(script);
  }
}

/**
 * Load a stylesheet
 */
export function loadStylesheet(href: string): void {
  // Check if stylesheet is already loaded
  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (existingLink) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Load multiple stylesheets
 */
export function loadStylesheets(hrefs: string[]): void {
  hrefs.forEach(loadStylesheet);
}
