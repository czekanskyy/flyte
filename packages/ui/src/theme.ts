export const THEMES = ["light", "dark", "night"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "flyte-theme";

export const DEFAULT_THEME: Theme = "dark";

/** Inline script: apply stored theme before paint to avoid a white flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"||t==="night")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark" || value === "night";
}

export function applyTheme(theme: Theme, root: HTMLElement): void {
  root.setAttribute("data-theme", theme);
}

export function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(value)) return value;
  } catch {
    // Private mode, or SSR.
  }
  return DEFAULT_THEME;
}

export function persistTheme(theme: Theme, root: HTMLElement): void {
  applyTheme(theme, root);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode.
  }
}
