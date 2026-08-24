/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  safelist: [
    "bg-app-background",
    "bg-app-background-soft",
    "bg-app-surface",
    "bg-app-surface-elevated",
    "bg-app-primary",
    "bg-app-primary-pressed",
    "bg-app-primary-light",
    "bg-app-primary-soft",

    "text-app-text",
    "text-app-text-secondary",
    "text-app-text-muted",
    "text-app-text-inverse",

    "border-app-border",
    "border-app-border-subtle",

    "bg-app-success",
    "bg-app-warning",
    "bg-app-error",
    "bg-app-info",
    "bg-app-disabled",

    "text-app-success",
    "text-app-warning",
    "text-app-error",
    "text-app-info",

    "active:bg-app-primary-pressed",
  ],

  theme: {
    extend: {
      colors: {
        app: {
          background: "white",
          "background-soft": "#EEF4FA",

          surface: "#FFFFFF",
          "surface-elevated": "#F3F7FB",

          primary: "#1677FF",
          "primary-pressed": "#0F5FD1",
          "primary-light": "#4A96FF",
          "primary-soft": "#E8F2FF",

          text: "#0B1F3A",
          "text-secondary": "#52657A",
          "text-muted": "#8292A6",
          "text-inverse": "#FFFFFF",

          border: "#D8E2EE",
          "border-subtle": "#E8EEF5",

          success: "#22A06B",
          warning: "#E69B19",
          error: "#E5484D",
          info: "#1677FF",

          disabled: "#B9C5D2",
        },
      },
    },
  },

  plugins: [],
};