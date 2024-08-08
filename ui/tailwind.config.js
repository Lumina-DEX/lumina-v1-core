/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/daisyui/dist/**/*.js",
    "node_modules/react-daisyui/dist/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ["Orbitron"],
        secondary: ["Cutive Mono"],
      },
      colors: {
        "background-l0": "var(--background-l0)",
        "background-l1": "var(--background-l1)",
        "background-l2": "var(--background-l2)",
        "background-l3": "var(--background-l3)",
        "background-disabled": "var(--background-disabled)",
        "background-button": "var(--background-button)",
        default: "var(--text-default)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        disabled: "var(--text-disabled)",
        success: "var(--text-success)",
        failure: "var(--text-failure)",
        "action-primary": "var(--text-action-primary)",
        "action-secondary": "var(--text-action-secondary)",
        "icon-primary": "var(--icon-primary)",
        "icon-secondary": "var(--icon-secondary)",
        "icon-tertiary": "var(--icon-tertiary)",
        "icon-disabled": "var(--icon-disabled)",
        "icon-success": "var(--icon-success)",
        "icon-warn": "var(--icon-warn)",
        "icon-failure": "var(--icon-failure)",

        "light-100": "var(--light-100)",
        "light-200": "var(--light-200)",
        "light-300": "var(--light-300)",
        "blue-100": "var(--blue-100)",
      },
      backgroundImage: {
        lumina: "url(/assets/backgrounds/holo.png)",
      },
    },
  },
  variants: {},
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          ...require("./src/theme/daisy").light,
        },
      },
    ],
  },
};
