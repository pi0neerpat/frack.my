export const colors = {
  primary: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
  },
  // Add other color palettes as needed
} as const;

// CSS Variable mapping
export const cssColorVariables = {
  primary: "var(--color-primary)",
  "primary-50": "var(--color-primary-50)",
  "primary-100": "var(--color-primary-100)",
  "primary-200": "var(--color-primary-200)",
  "primary-300": "var(--color-primary-300)",
  "primary-400": "var(--color-primary-400)",
  "primary-500": "var(--color-primary-500)",
  "primary-600": "var(--color-primary-600)",
  "primary-700": "var(--color-primary-700)",
  "primary-800": "var(--color-primary-800)",
  "primary-900": "var(--color-primary-900)",
} as const;
