/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Monochrome system. Everything reads in black-and-white first.
        ink: {
          DEFAULT: "#0A0A0A", // near-black — headings, primary buttons, filled surfaces
          muted: "#737373",   // secondary text, inactive tabs, captions
        },
        border: "#E5E5E5",    // single hairline grey for all dividers and outlines
        surface: "#F5F5F5",   // hover states, subtle backgrounds
        // One chromatic accent — electric blue. Used only for status
        // badges/dots/focus rings. Nothing else gets a hue.
        accent: "#2563EB",
        // Destructive actions — kept red because safety-critical actions must
        // never read as "just bold black."
        danger: "#DC2626",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      // Crisp corners everywhere. Override Tailwind's round defaults.
      borderRadius: {
        xl: "6px",
        "2xl": "6px",
      },
      // No soft drop-shadows. Separation comes from 1px hairlines + whitespace.
      boxShadow: {
        sheet: "0 -1px 0 #E5E5E5",
      },
      maxWidth: {
        app: "30rem",
      },
    },
  },
  plugins: [],
};
