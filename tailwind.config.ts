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
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Google Sans Flex", "system-ui", "sans-serif"],
        serif: ["Google Sans Flex", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        display: ["Google Sans Flex", "system-ui", "sans-serif"],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        regular: "400",
        medium: "500",
        semibold: "600",
      },
      fontSize: {
        "page-title": ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "500" }],
        "section": ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.12em", fontWeight: "600" }],
        "card-title": ["0.75rem", { lineHeight: "1.4", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body": ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "body-sm": ["0.6875rem", { lineHeight: "1.45", letterSpacing: "0", fontWeight: "400" }],
        "caption": ["0.5625rem", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "500" }],
        "micro": ["0.5rem", { lineHeight: "1.2", letterSpacing: "0.1em", fontWeight: "500" }],
        "mono": ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "400" }],
        "kpi": ["1.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "300" }],
        "kpi-sm": ["1rem", { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "300" }],
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "text-reveal": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "image-reveal": {
          from: { opacity: "0", transform: "scale(1.06)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "marquee": "marquee 30s linear infinite",
        "text-reveal": "text-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "image-reveal": "image-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
