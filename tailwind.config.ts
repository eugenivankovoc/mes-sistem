import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          active: "hsl(var(--sidebar-active))",
        },
        topbar: {
          DEFAULT: "hsl(var(--topbar-background))",
          foreground: "hsl(var(--topbar-foreground))",
          border: "hsl(var(--topbar-border))",
        },
        status: {
          "new-bg": "hsl(var(--status-new-bg))",
          "new-text": "hsl(var(--status-new-text))",
          "new-dot": "hsl(var(--status-new-dot))",
          "ready-bg": "hsl(var(--status-ready-bg))",
          "ready-text": "hsl(var(--status-ready-text))",
          "ready-dot": "hsl(var(--status-ready-dot))",
          "released-bg": "hsl(var(--status-released-bg))",
          "released-text": "hsl(var(--status-released-text))",
          "released-dot": "hsl(var(--status-released-dot))",
          "in-production-bg": "hsl(var(--status-in-production-bg))",
          "in-production-text": "hsl(var(--status-in-production-text))",
          "in-production-dot": "hsl(var(--status-in-production-dot))",
          "completed-bg": "hsl(var(--status-completed-bg))",
          "completed-text": "hsl(var(--status-completed-text))",
          "completed-dot": "hsl(var(--status-completed-dot))",
          "archived-bg": "hsl(var(--status-archived-bg))",
          "archived-text": "hsl(var(--status-archived-text))",
          "archived-dot": "hsl(var(--status-archived-dot))",
          "rework-bg": "hsl(var(--status-rework-bg))",
          "rework-text": "hsl(var(--status-rework-text))",
          "rework-dot": "hsl(var(--status-rework-dot))",
        },
        table: {
          "header-bg": "hsl(var(--table-header-bg))",
          "header-text": "hsl(var(--table-header-text))",
          "row-hover": "hsl(var(--table-row-hover))",
          "row-stripe": "hsl(var(--table-row-stripe))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "row-insert": {
          "0%": { backgroundColor: "hsl(122 39% 49% / 0.15)" },
          "100%": { backgroundColor: "transparent" },
        },
        "row-update": {
          "0%": { backgroundColor: "hsl(214 69% 39% / 0.1)" },
          "100%": { backgroundColor: "transparent" },
        },
        "row-delete": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateX(20px)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "row-insert": "row-insert 2s ease-out",
        "row-update": "row-update 2s ease-out",
        "row-delete": "row-delete 0.5s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
