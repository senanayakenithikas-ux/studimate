export const APP_THEMES = [
  {
    id: "default",
    label: "Default",
    description: "Original Studimate theme",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark mode",
  },
  {
    id: "light",
    label: "Light",
    description: "Light mode",
  },
] as const;

export type AppThemeId = (typeof APP_THEMES)[number]["id"];

export const DEFAULT_THEME: AppThemeId = "default";
