"use client";

import { THEMES, type Theme } from "./theme.ts";
import { useTheme } from "./theme-provider.tsx";

export type ThemeSwitchLabels = {
  group: string;
  light: string;
  dark: string;
  night: string;
};

type Props = {
  labels: ThemeSwitchLabels;
};

export function ThemeSwitch({ labels }: Props) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label={labels.group}>
      {THEMES.map((id: Theme) => (
        <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)}>
          {labels[id]}
        </button>
      ))}
    </div>
  );
}
