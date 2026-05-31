/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Roomie palette (§6)
        accent: {
          DEFAULT: "#5C8B5A", // sage
          soft: "#EAF1E9",
          ink: "#3F6A3D",
        },
        surface: "#F7F8FA",
        ink: {
          DEFAULT: "#111827",
          muted: "#6B7280",
        },
        pending: "#F59E0B",
        success: "#10B981",
        danger: "#EF4444",
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
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        sheet: "0 -8px 30px rgba(16,24,40,0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      maxWidth: {
        app: "30rem", // phone-width column on desktop
      },
    },
  },
  plugins: [],
};
