const THEMES = {
  dark: {
    colors: {
      primary: "#3b82f6",
      secondary: "#1f2937",
      background: "#111827",
      surface: "#1f2937",
      surface2: "#374151",
      text: "#f3f4f6",
      textSecondary: "#9ca3af",
      border: "#4b5563",
      error: "#ef4444",
      success: "#10b981",
      warning: "#f59e0b",
    },
  },
  light: {
    colors: {
      primary: "#2563eb",
      secondary: "#f3f4f6",
      background: "#ffffff",
      surface: "#f9fafb",
      surface2: "#e5e7eb",
      text: "#111827",
      textSecondary: "#4b5563",
      border: "#d1d5db",
      error: "#dc2626",
      success: "#059669",
      warning: "#d97706",
    },
  },
};

export const getTheme = (name = "dark") => THEMES[name] || THEMES.dark;
