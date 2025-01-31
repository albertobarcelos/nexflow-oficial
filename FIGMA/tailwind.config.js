/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "betaagendorcombr-whisper": "#f0f0f7",
        "betaagendorcombr-white": "#fff",
        "betaagendorcombr-dodger-blue": "#5b4fff",
        "betaagendorcombr-east-bay": "#4f497a",
        "betaagendorcombr-snuff": "#d3d3e8",
        "betaagendorcombr-mirage": "#212040",
        "betaagendorcombr-blue-bell": "#9393c2",
        "betaagendorcombr-snuff-50": "rgba(211, 211, 232, 0.5)",
        "betaagendorcombr-black": "#000",
        "betaagendorcombr-fog": "#f9e2e2",
      },
      spacing: {
        "width-1280": "1280px",
        "height-803": "803px",
        "item-spacing-xs": "8px",
        "height-256": "256px",
        "item-spacing-xxs": "4px",
        "width-368-66": "368.6600036621094px",
        "item-spacing-0": "-1.1368683772161605e-13px",
        "height-36": "36px",
        "height-66": "66px",
        "height-62": "62px",
        "line-height-21": "21px",
        "width-512": "512px",
      },
      fontFamily: {
        "betaagendorcombr-semantic-button": "Rubik",
      },
      borderRadius: {
        "item-spacing-xs": "8px",
      },
    },
    fontSize: {
      sm: "14px",
      xs: "12px",
      "3xs": "10px",
      base: "16px",
      xl: "20px",
      inherit: "inherit",
    },
    screens: {
      lg: {
        max: "1200px",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
