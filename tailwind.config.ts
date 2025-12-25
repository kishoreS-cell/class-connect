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
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
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
        },
        terracotta: {
          DEFAULT: "hsl(var(--terracotta))",
          light: "hsl(var(--terracotta-light))",
          dark: "hsl(var(--terracotta-dark))",
        },
        sage: {
          DEFAULT: "hsl(var(--sage))",
          light: "hsl(var(--sage-light))",
        },
        cream: {
          DEFAULT: "hsl(var(--cream))",
          dark: "hsl(var(--cream-dark))",
        },
        coral: "hsl(var(--coral))",
        mustard: "hsl(var(--mustard))",
        navy: "hsl(var(--navy))",
        "warm-gray": "hsl(var(--warm-gray))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'warm': 'var(--shadow-warm)',
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
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0) rotateX(0)" },
          "50%": { transform: "translateY(-10px) rotateX(2deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotateY(0)" },
          "50%": { transform: "translateY(-5px) rotateY(3deg)" },
        },
        "tilt-in": {
          from: { opacity: "0", transform: "perspective(1000px) rotateX(-10deg) translateY(20px)" },
          to: { opacity: "1", transform: "perspective(1000px) rotateX(0) translateY(0)" },
        },
        "flip-in": {
          from: { opacity: "0", transform: "perspective(1000px) rotateY(-15deg) translateX(-30px)" },
          to: { opacity: "1", transform: "perspective(1000px) rotateY(0) translateX(0)" },
        },
        "scale-3d": {
          from: { opacity: "0", transform: "perspective(1000px) scale(0.8) translateZ(-50px)" },
          to: { opacity: "1", transform: "perspective(1000px) scale(1) translateZ(0)" },
        },
        "rotate-in": {
          from: { opacity: "0", transform: "perspective(1000px) rotateY(-90deg)" },
          to: { opacity: "1", transform: "perspective(1000px) rotateY(0deg)" },
        },
        "bounce-3d": {
          "0%, 100%": { transform: "perspective(1000px) translateZ(0) rotateX(0)" },
          "50%": { transform: "perspective(1000px) translateZ(20px) rotateX(5deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "float": "float 4s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "tilt-in": "tilt-in 0.6s ease-out forwards",
        "flip-in": "flip-in 0.7s ease-out forwards",
        "scale-3d": "scale-3d 0.5s ease-out forwards",
        "rotate-in": "rotate-in 0.8s ease-out forwards",
        "bounce-3d": "bounce-3d 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
