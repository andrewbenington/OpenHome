# Web Application Design Guidelines

## Purpose

This document provides comprehensive guidelines for creating mobile-friendly, responsive, and high-quality web applications. These guidelines are style-agnostic and focus on structure, behavior, user experience patterns, and technical excellence rather than specific visual aesthetics.

---

## Table of Contents

1. [Visual Design & Contextual Aesthetics](#visual-design--contextual-aesthetics)
2. [Technical Stack & Foundation](#technical-stack--foundation)
3. [Project Architecture & Organization](#project-architecture--organization)
4. [Responsive Design Principles](#responsive-design-principles)
5. [Component Design Patterns](#component-design-patterns)
6. [State Management](#state-management)
7. [User Experience (UX) Features](#user-experience-ux-features)
8. [Accessibility Requirements](#accessibility-requirements)
9. [Performance Optimization](#performance-optimization)
10. [Code Quality Standards](#code-quality-standards)
11. [Error Handling & Resilience](#error-handling--resilience)
12. [Testing Considerations](#testing-considerations)

---

## Visual Design & Contextual Aesthetics

### Philosophy: Design Should Match Context

While the technical guidelines in this document are universal, **visual design should be contextually appropriate** to the application's domain, purpose, and target audience. A Pokemon save editor should feel different from a financial dashboard, which should feel different from a recipe app.

**Key Principle:** Analyze the domain first, then choose visual aesthetics that reinforce the application's purpose and create an cohesive, memorable experience.

---

### Step 1: Domain Analysis

Before writing any CSS, ask these questions:

1. **What is this application about?**
   - Subject matter (gaming, finance, education, entertainment, etc.)
   - User expectations and mental models
   - Industry conventions and familiar patterns

2. **Who are the users?**
   - Demographics and preferences
   - Technical sophistication
   - Device usage patterns (mobile-first, desktop power users, etc.)

3. **What feeling should it evoke?**
   - Professional and trustworthy (banking, healthcare)
   - Playful and creative (games, social media)
   - Minimal and focused (productivity tools)
   - Nostalgic and familiar (retro themes)
   - Modern and cutting-edge (tech products)

4. **What are the core metaphors?**
   - Does it mirror a physical object? (notebook, dashboard, deck of cards)
   - Does it reference a specific era or style? (retro gaming, brutalism, neumorphism)
   - Are there domain-specific UI patterns? (trading charts, game inventories, timelines)

---

### Step 2: Choosing Visual Direction

Based on domain analysis, select an appropriate aesthetic direction:

#### Gaming & Entertainment
**Characteristics:**
- Bold, vibrant colors
- Playful typography (pixel fonts, rounded sans-serifs)
- Animations and micro-interactions
- Visual effects (shadows, glows, particles)
- Thematic consistency with game/content

**Example: Retro Game Save Editor**
```css
:root {
  /* Pixel/retro gaming aesthetic */
  --pixel-font-family: 'Press Start 2P', monospace;
  --pixel-border-width: 3px;
  --pixel-shadow: rgba(10, 14, 39, 0.25);

  /* Color palette matching game theme */
  --accent: #8b1538; /* Deep crimson for Pokemon Radical Red */
  --bg: #f8f7f3; /* Vintage paper tone */

  /* Retro effects */
  --scanline-pattern: repeating-linear-gradient(
    0deg,
    rgba(10, 14, 39, 0.04),
    rgba(10, 14, 39, 0.04) 1px,
    transparent 1px,
    transparent 4px
  );
  --glassmorphism-blur: 18px;
}

body {
  font-family: 'DotGothic16', monospace;
  background-image: var(--scanline-pattern);
}

.button {
  border: var(--pixel-border-width) solid var(--accent);
  box-shadow: 4px 4px 0 var(--pixel-shadow);
  font-family: var(--pixel-font-family);
  text-transform: uppercase;
}
```

#### Professional & Business
**Characteristics:**
- Clean, minimal layouts
- Professional typography (Inter, SF Pro, Roboto)
- Muted, sophisticated colors
- Subtle shadows and depth
- Data visualization friendly

**Example: Analytics Dashboard**
```css
:root {
  /* Professional color palette */
  --primary: #0066cc; /* Trust-building blue */
  --bg: #ffffff;
  --surface: #f8f9fa;
  --text: #1a1a1a;
  --text-secondary: #6c757d;
  --border: #dee2e6;

  /* Refined shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Spacing scale */
  --spacing-unit: 8px;
  --border-radius: 8px;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: -0.011em;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: calc(var(--spacing-unit) * 3);
}
```

#### Creative & Artistic
**Characteristics:**
- Bold typography and creative layouts
- Vibrant or unconventional color palettes
- Generous whitespace
- Asymmetric layouts
- Expressive visual effects

**Example: Portfolio Website**
```css
:root {
  /* Vibrant, creative palette */
  --primary: #ff6b6b; /* Energetic coral */
  --secondary: #4ecdc4; /* Refreshing teal */
  --accent: #ffe66d; /* Warm yellow */
  --bg: #f7f7f7;
  --text: #2d3436;

  /* Dynamic typography */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Roboto', sans-serif;

  /* Expressive shadows */
  --shadow-creative: 12px 12px 0 rgba(0, 0, 0, 0.1);
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.featured-work {
  border: 3px solid var(--text);
  box-shadow: var(--shadow-creative);
  transition: transform 0.3s ease;
}

.featured-work:hover {
  transform: translate(-4px, -4px);
  box-shadow: 16px 16px 0 rgba(0, 0, 0, 0.1);
}
```

#### Productivity & Tools
**Characteristics:**
- Minimal, distraction-free interface
- Monochromatic or low-contrast palettes
- Functional typography (system fonts)
- Fast, snappy interactions
- Keyboard-first design

**Example: Text Editor / Note App**
```css
:root {
  /* Minimal palette */
  --bg: #fafafa;
  --surface: #ffffff;
  --text: #333333;
  --text-muted: #999999;
  --accent: #5865f2;
  --border: #e8e8e8;

  /* System fonts for familiarity */
  --font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;
  --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Subtle transitions */
  --transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  font-family: var(--font-ui);
  background: var(--bg);
  color: var(--text);
}

.editor {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.8;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 24px;
}

.button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.button:hover {
  color: var(--text);
}
```

#### E-commerce & Retail
**Characteristics:**
- Product-focused layouts
- Trust-building elements (badges, reviews)
- Clear CTAs with conversion optimization
- High-quality imagery
- Established e-commerce patterns

**Example: Online Store**
```css
:root {
  /* Trustworthy, conversion-focused palette */
  --primary: #16a34a; /* Green for CTAs */
  --bg: #ffffff;
  --surface: #f9fafb;
  --text: #111827;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --success: #10b981;
  --warning: #f59e0b;

  /* E-commerce spacing */
  --product-gap: 24px;
  --border-radius: 12px;

  /* Shadows for product cards */
  --shadow-product: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-product-hover: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.product-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-product);
  transition: all 0.2s ease;
}

.product-card:hover {
  box-shadow: var(--shadow-product-hover);
  transform: translateY(-2px);
}

.add-to-cart {
  background: var(--primary);
  color: white;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 8px;
  border: none;
  width: 100%;
}
```

---

### Step 3: Design System with CSS Custom Properties

Always build a cohesive design system using CSS custom properties (variables):

#### Essential Design Tokens

```css
:root {
  /* ===== COLORS ===== */
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;

  /* Surfaces (cards, modals) */
  --surface: #ffffff;
  --surface-elevated: #ffffff;

  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #6c757d;
  --text-tertiary: #adb5bd;

  /* Borders */
  --border-color: #dee2e6;
  --border-color-strong: #adb5bd;

  /* Brand colors */
  --brand-primary: #0066cc;
  --brand-secondary: #6610f2;
  --brand-accent: #fd7e14;

  /* Semantic colors */
  --success: #28a745;
  --warning: #ffc107;
  --error: #dc3545;
  --info: #17a2b8;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

  /* ===== TYPOGRAPHY ===== */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: Georgia, Cambria, 'Times New Roman', serif;
  --font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;

  /* Font sizes (responsive via clamp) */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* ===== SPACING ===== */
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-10: 2.5rem;  /* 40px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */

  /* ===== BORDERS ===== */
  --border-width-thin: 1px;
  --border-width-medium: 2px;
  --border-width-thick: 4px;

  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-full: 9999px;

  /* ===== TRANSITIONS ===== */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ===== Z-INDEX SCALE ===== */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* Dark mode variants */
:root.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #404040;

  --surface: #2d2d2d;
  --surface-elevated: #404040;

  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-tertiary: #808080;

  --border-color: #404040;
  --border-color-strong: #606060;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
}
```

---

### Step 4: Typography Selection

Choose fonts that reinforce your aesthetic direction:

#### Font Pairing Strategies

1. **Classic Professional:**
   ```css
   --font-display: 'Inter', sans-serif;
   --font-body: 'Inter', sans-serif;
   ```

2. **Editorial / Content-Heavy:**
   ```css
   --font-display: 'Playfair Display', serif; /* Headers */
   --font-body: 'Source Sans Pro', sans-serif; /* Body text */
   ```

3. **Technical / Developer Tools:**
   ```css
   --font-ui: -apple-system, BlinkMacSystemFont, sans-serif;
   --font-code: 'JetBrains Mono', 'Fira Code', monospace;
   ```

4. **Retro / Gaming:**
   ```css
   --font-display: 'Press Start 2P', monospace;
   --font-body: 'DotGothic16', monospace;
   ```

5. **Modern / Minimal:**
   ```css
   --font-display: 'Sohne', 'Helvetica Neue', sans-serif;
   --font-body: system-ui, sans-serif;
   ```

#### Typography Best Practices

```css
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  letter-spacing: -0.011em; /* Slight negative tracking for modern look */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em; /* Tighter for large text */
}

/* Responsive typography with clamp */
h1 {
  font-size: clamp(2rem, 5vw, 3rem);
}

h2 {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

/* Optimize for readability */
p {
  max-width: 65ch; /* Optimal line length */
  line-height: var(--leading-relaxed);
}

/* Code/monospace text */
code, pre {
  font-family: var(--font-mono);
  font-size: 0.9em;
}
```

---

### Step 5: Color Psychology & Palette Creation

#### Color Psychology Guide

| Color | Associations | Best For |
|-------|-------------|----------|
| **Blue** | Trust, stability, professionalism | Finance, healthcare, business software |
| **Green** | Growth, health, success | E-commerce CTAs, health apps, environmental |
| **Red** | Energy, urgency, passion | Gaming, entertainment, alerts, sales |
| **Purple** | Creativity, luxury, spirituality | Creative tools, premium products |
| **Orange** | Enthusiasm, affordability, fun | Social media, food, entertainment |
| **Yellow** | Optimism, clarity, warmth | Education, children's apps, warnings |
| **Gray** | Neutrality, sophistication | Professional, minimal, backgrounds |
| **Black** | Luxury, elegance, power | Premium brands, fashion, photography |

#### Creating a Cohesive Palette

```css
:root {
  /* Start with a primary brand color */
  --brand-primary: #0066cc;

  /* Generate shades (lighter and darker variants) */
  --brand-50: #e6f2ff;   /* Very light */
  --brand-100: #b3d9ff;  /* Light */
  --brand-200: #80bfff;  /* Light-medium */
  --brand-300: #4da6ff;  /* Medium */
  --brand-400: #1a8cff;  /* Medium-dark */
  --brand-500: #0066cc;  /* Base (primary) */
  --brand-600: #0052a3;  /* Dark */
  --brand-700: #003d7a;  /* Darker */
  --brand-800: #002952;  /* Very dark */
  --brand-900: #001429;  /* Almost black */

  /* Use shades contextually */
  --button-bg: var(--brand-500);
  --button-hover: var(--brand-600);
  --button-active: var(--brand-700);
  --link-color: var(--brand-600);
  --focus-ring: var(--brand-200);
}
```

**Tools for palette generation:**
- Use HSL instead of hex for easier manipulation
- Generate shades by adjusting lightness
- Maintain consistent saturation for harmony

```css
:root {
  /* HSL for easier shade generation */
  --primary-h: 210;   /* Hue */
  --primary-s: 100%;  /* Saturation */

  /* Generate shades by adjusting lightness (L) */
  --primary-50: hsl(var(--primary-h), var(--primary-s), 95%);
  --primary-100: hsl(var(--primary-h), var(--primary-s), 85%);
  --primary-500: hsl(var(--primary-h), var(--primary-s), 50%);
  --primary-900: hsl(var(--primary-h), var(--primary-s), 15%);
}
```

---

### Step 6: Visual Effects & Micro-Interactions

Add personality through subtle details:

#### Shadows & Depth

```css
/* Soft, modern shadows */
.card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.12);
}

.card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12),
              0 6px 6px rgba(0, 0, 0, 0.08);
}

/* Retro/pixel shadows */
.pixel-button {
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.25);
}

/* Neumorphism (subtle) */
.neumorphic {
  background: #e0e5ec;
  box-shadow: 9px 9px 16px rgba(163, 177, 198, 0.6),
              -9px -9px 16px rgba(255, 255, 255, 0.5);
}

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
```

#### Transitions & Animations

```css
/* Smooth, purposeful transitions */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Loading states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Fade in content */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}
```

#### Hover & Focus States

```css
/* Clear, accessible hover states */
.interactive-element {
  position: relative;
  transition: all 0.2s ease;
}

.interactive-element::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: -1;
}

.interactive-element:hover::before {
  opacity: 0.1;
}

/* Focus states for accessibility */
.interactive-element:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

### Step 7: Domain-Specific Patterns

Apply UI patterns that match the domain:

#### Data Dashboards
- Card-based layouts with metrics
- Charts and data visualizations
- Filters and date pickers
- Tables with sorting
- KPI highlights

#### Content Platforms
- Hero sections with imagery
- Card grids for articles/posts
- Tags and categories
- Search and filtering
- Pagination or infinite scroll

#### E-commerce
- Product grids with imagery
- Shopping cart and checkout flow
- Product detail pages
- Reviews and ratings
- Wishlist and favorites

#### Gaming / Entertainment
- Inventory-style grids
- Character/item cards
- Stats and progression bars
- Achievement badges
- Leaderboards and rankings

#### Productivity Tools
- Sidebar navigation
- Command palette (Cmd+K)
- Keyboard shortcuts
- Split views and panels
- Quick actions and shortcuts

---

### Examples: Matching Design to Domain

#### Example 1: Pokemon Save Editor (Retro Gaming)

**Domain Analysis:**
- **Subject:** Pokemon game data, ROM hack tools
- **Users:** Gamers, ROM hackers, nostalgic players
- **Feeling:** Nostalgic, playful, retro gaming aesthetic
- **Metaphors:** Game Boy/GBA era, PC storage boxes, trainer bags

**Design Decisions:**
```css
:root {
  /* Retro gaming palette */
  --font-pixel: 'Press Start 2P', monospace;
  --font-retro: 'DotGothic16', monospace;
  --accent: #8b1538; /* Radical Red theme color */
  --bg: #f8f7f3; /* Vintage paper */
  --pixel-border: 3px;

  /* CRT screen effect */
  --scanlines: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04),
    rgba(0, 0, 0, 0.04) 1px,
    transparent 1px,
    transparent 4px
  );
}

body {
  font-family: var(--font-retro);
  background-image: var(--scanlines);
}

.box-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* Classic PC box layout */
  gap: 14px;
}

.pokemon-slot {
  border: var(--pixel-border) solid var(--border);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25); /* Pixel shadow */
  backdrop-filter: blur(18px); /* Glassmorphism */
}

button {
  font-family: var(--font-pixel);
  text-transform: uppercase;
  border: var(--pixel-border) solid var(--accent);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.25);
}
```

#### Example 2: Financial Dashboard (Professional)

**Domain Analysis:**
- **Subject:** Financial data, analytics, reporting
- **Users:** Business professionals, analysts
- **Feeling:** Trustworthy, professional, data-focused
- **Metaphors:** Spreadsheets, reports, charts

**Design Decisions:**
```css
:root {
  /* Professional palette */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --primary: #0066cc; /* Trust-building blue */
  --bg: #ffffff;
  --surface: #f8f9fa;
  --text: #1a1a1a;
  --border: #dee2e6;

  /* Subtle, refined shadows */
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

body {
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: -0.011em;
}

.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow);
}

.data-table {
  font-variant-numeric: tabular-nums; /* Aligned numbers */
  font-feature-settings: 'tnum'; /* Tabular numerals */
}

button {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
}
```

#### Example 3: Recipe App (Warm & Inviting)

**Domain Analysis:**
- **Subject:** Cooking, food, recipes
- **Users:** Home cooks, food enthusiasts
- **Feeling:** Warm, inviting, appetizing, approachable
- **Metaphors:** Recipe cards, cookbooks, kitchen

**Design Decisions:**
```css
:root {
  /* Warm, appetizing palette */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Sans Pro', sans-serif;
  --primary: #d4773c; /* Warm terracotta */
  --accent: #6b9080; /* Fresh herb green */
  --bg: #fdfcf9; /* Cream */
  --surface: #ffffff;
  --text: #2d2d2d;
}

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
}

h1, h2, h3 {
  font-family: var(--font-display);
  color: var(--primary);
}

.recipe-card {
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.recipe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.recipe-image {
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

button.save-recipe {
  background: var(--accent);
  color: white;
  border-radius: 24px;
  padding: 12px 24px;
}
```

---

### Checklist: Creating Contextually Appropriate Design

Before starting implementation, ensure you've addressed:

- [ ] **Analyzed the domain** and identified core metaphors
- [ ] **Chosen an aesthetic direction** that matches user expectations
- [ ] **Created a design system** with CSS custom properties for colors, typography, spacing
- [ ] **Selected appropriate typography** that reinforces the brand/purpose
- [ ] **Built a cohesive color palette** with semantic meaning
- [ ] **Implemented dark mode** (if appropriate) with proper theme switching
- [ ] **Added micro-interactions** and transitions for polish
- [ ] **Used domain-appropriate UI patterns** (grids, cards, tables, etc.)
- [ ] **Maintained consistency** across all components and pages
- [ ] **Tested accessibility** (contrast ratios, font sizes, touch targets)
- [ ] **Verified responsive behavior** across mobile, tablet, and desktop

---

### Key Principles Summary

1. **Context First:** Always analyze the domain before choosing visual aesthetics
2. **Cohesive Systems:** Use CSS custom properties to create consistent design systems
3. **Meaningful Choices:** Every design decision (color, typography, spacing) should reinforce the application's purpose
4. **Polish Matters:** Subtle details (shadows, transitions, hover states) create memorable experiences
5. **User Expectations:** Match industry conventions while adding unique personality
6. **Accessibility Always:** Beautiful design must be accessible to all users

By following these guidelines, every web application you create will have a unique, contextually appropriate visual identity while maintaining technical excellence.

---

## Technical Stack & Foundation

### Build System

When creating web applications, use modern build tooling that provides:

- **Fast development server** with hot module replacement (HMR)
- **Optimized production builds** with tree-shaking and code splitting
- **TypeScript support** out of the box
- **CSS preprocessing** capabilities
- **Asset optimization** (images, fonts, etc.)

**Recommended:** Vite for its speed and modern defaults, or Next.js for server-side rendering needs.

### Type Safety

Always use **TypeScript** with strict mode enabled:

```typescript
// tsconfig.json should include:
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Benefits:**
- Catch errors at compile time rather than runtime
- Better IDE autocomplete and refactoring support
- Self-documenting code through type definitions
- Safer refactoring across large codebases

### Framework Selection

Use **React** (or similar component-based framework) with:

- **Functional components** over class components
- **Hooks** for state and side effects
- **Modern React patterns** (composition, render props when needed)
- **React 18+** features (concurrent rendering, automatic batching)

---

## Project Architecture & Organization

### Directory Structure

Organize the codebase with clear separation of concerns:

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (buttons, inputs, modals)
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components (header, footer, nav)
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
│   ├── utils/         # General utilities
│   ├── data/          # Static data, constants
│   └── api/           # API client functions
├── styles/             # Global styles and theme
├── types/              # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

### Component Organization Principles

- **One component per file** with a clear, descriptive name
- **Co-locate related files** (component, styles, tests together if using CSS modules)
- **Index files** for clean imports: `components/common/index.ts`
- **Separate container and presentational components** when logic becomes complex

### File Naming Conventions

- **Components:** PascalCase (`FileUpload.tsx`, `PokemonDetailModal.tsx`)
- **Utilities:** camelCase (`spriteUtils.ts`, `formValidation.ts`)
- **Hooks:** camelCase with `use` prefix (`useDebounce.ts`, `useDarkMode.ts`)
- **Types:** PascalCase (`UserData.ts`, `ApiResponse.ts`)
- **Constants:** UPPER_SNAKE_CASE in `constants.ts`

---

## Responsive Design Principles

### Mobile-First Approach

Always design and code for mobile devices first, then progressively enhance for larger screens:

```css
/* Mobile styles (default) */
.container {
  padding: 12px;
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### Standard Breakpoints

Use consistent breakpoints across the application:

- **Mobile:** `< 480px` (default, no media query needed)
- **Tablet:** `≥ 768px` (`@media (min-width: 768px)`)
- **Desktop:** `≥ 1024px` (`@media (min-width: 1024px)`)
- **Large Desktop:** `≥ 1440px` (when needed for very large screens)

### Responsive Layout Patterns

#### Grid Systems

Use CSS Grid for complex layouts with automatic responsiveness:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
```

**Benefits:**
- Automatically wraps items based on available space
- No need for multiple media queries
- Maintains consistent spacing

#### Flexbox for One-Dimensional Layouts

Use Flexbox for navigation, button groups, and linear layouts:

```css
.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
  }
}
```

#### Container Max-Width

Always constrain content width on large screens for readability:

```css
.page-container {
  max-width: 1220px;
  margin: 0 auto;
  padding: 0 20px;
}
```

### Responsive Typography

Scale typography appropriately across devices:

```css
.heading {
  font-size: 22px;
  line-height: 1.3;
}

@media (min-width: 768px) {
  .heading {
    font-size: 26px;
  }
}

@media (min-width: 1024px) {
  .heading {
    font-size: 32px;
  }
}
```

**Alternative:** Use `clamp()` for fluid typography:

```css
.heading {
  font-size: clamp(22px, 4vw, 32px);
}
```

### Touch-Friendly Interface

Ensure all interactive elements meet minimum touch target sizes:

- **Minimum touch target:** 44x44 pixels (Apple), 48x48 pixels (Material Design)
- **Spacing between targets:** At least 8px
- **Button padding:** Generous padding for easy tapping

```css
button {
  min-height: 44px;
  padding: 12px 24px;
  margin: 4px;
}

@media (max-width: 768px) {
  button {
    width: 100%; /* Full-width buttons on mobile */
    padding: 14px 16px;
  }
}
```

### Responsive Images and Media

Handle images responsively with appropriate sizing and fallbacks:

```tsx
<img
  src={imageUrl}
  alt="Descriptive alt text"
  style={{ maxWidth: '100%', height: 'auto' }}
  onError={(e) => {
    e.currentTarget.src = fallbackImageUrl;
  }}
/>
```

### Viewport Configuration

Always include proper viewport meta tag in `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## Component Design Patterns

### TypeScript Props Interfaces

Define clear interfaces for all component props:

```typescript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}) => {
  // Component implementation
};
```

### Composition Over Inheritance

Build complex UIs through component composition:

```tsx
// Bad: Monolithic component
<ComplexForm />

// Good: Composed components
<Form>
  <FormSection title="Personal Info">
    <Input label="Name" />
    <Input label="Email" />
  </FormSection>
  <FormSection title="Address">
    <Input label="Street" />
    <Input label="City" />
  </FormSection>
  <FormActions>
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Cancel</Button>
  </FormActions>
</Form>
```

### Controlled vs Uncontrolled Components

Prefer **controlled components** for form inputs:

```tsx
const [value, setValue] = useState('');

<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**When to use uncontrolled:**
- File inputs (must be uncontrolled)
- Integration with third-party libraries
- Performance-critical forms with many fields

### Modal/Dialog Pattern

Implement accessible modals with proper structure:

```tsx
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
```

**Key features:**
- Click outside to close
- Stop propagation on content
- Proper ARIA attributes
- Close button with aria-label
- Escape key handling (via custom hook)

### List Rendering with Keys

Always use stable, unique keys when rendering lists:

```tsx
// Bad
{items.map((item, index) => <Item key={index} {...item} />)}

// Good
{items.map((item) => <Item key={item.id} {...item} />)}
```

### Conditional Rendering Patterns

Use clear conditional rendering patterns:

```tsx
// For simple show/hide
{isVisible && <Component />}

// For binary conditions
{isLoading ? <Spinner /> : <Content />}

// For multiple conditions
{status === 'loading' && <Spinner />}
{status === 'error' && <ErrorMessage />}
{status === 'success' && <Content />}

// For complex conditions, extract to variable
const content = (() => {
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  return <Content data={data} />;
})();

return <div>{content}</div>;
```

---

## State Management

### Local State with useState

Use `useState` for component-local state:

```typescript
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState<FormData>({
  name: '',
  email: '',
});
```

### Derived State with useMemo

Compute derived values with `useMemo` to avoid unnecessary recalculations:

```typescript
const filteredItems = useMemo(() => {
  return items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [items, searchTerm]);

const sortedItems = useMemo(() => {
  return [...filteredItems].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.name.localeCompare(b.name);
    }
    return b.name.localeCompare(a.name);
  });
}, [filteredItems, sortOrder]);
```

### Context API for Global State

Use Context API for state that needs to be accessed by many components:

```typescript
// contexts/ThemeContext.tsx
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);

    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('darkMode', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### State Update Patterns

#### Immutable Updates

Always update state immutably:

```typescript
// Objects
setUser(prev => ({ ...prev, name: newName }));

// Nested objects
setData(prev => ({
  ...prev,
  user: {
    ...prev.user,
    profile: {
      ...prev.user.profile,
      email: newEmail,
    },
  },
}));

// Arrays - add item
setItems(prev => [...prev, newItem]);

// Arrays - remove item
setItems(prev => prev.filter(item => item.id !== itemId));

// Arrays - update item
setItems(prev =>
  prev.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  )
);
```

#### Functional Updates

Use functional updates when new state depends on previous state:

```typescript
// Bad
setCount(count + 1);

// Good
setCount(prev => prev + 1);
```

### Dirty State Tracking

Track unsaved changes to warn users before navigation:

```typescript
const [data, setData] = useState(initialData);
const [isDirty, setIsDirty] = useState(false);

const handleChange = (updates: Partial<typeof data>) => {
  setData(prev => ({ ...prev, ...updates }));
  setIsDirty(true);
};

const handleSave = async () => {
  await saveData(data);
  setIsDirty(false);
};

// Warn before leaving page
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

---

## User Experience (UX) Features

### Dark Mode Implementation

Implement dark mode with:

1. **System preference detection**
2. **User preference persistence** (localStorage)
3. **CSS custom properties** for theming
4. **Smooth transitions** between themes

```css
/* styles/theme.css */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #000000;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #007bff;
}

.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent-color: #4da6ff;
}

* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

### Form Validation Patterns

Implement comprehensive form validation:

```typescript
const [formData, setFormData] = useState({
  email: '',
  age: '',
});

const [errors, setErrors] = useState<Record<string, string>>({});

const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

const validateAge = (age: string): string | null => {
  const numAge = parseInt(age, 10);
  if (isNaN(numAge)) return 'Age must be a number';
  if (numAge < 0) return 'Age cannot be negative';
  if (numAge > 150) return 'Age must be realistic';
  return null;
};

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error on change
  setErrors(prev => ({ ...prev, [field]: '' }));
};

const handleBlur = (field: string) => {
  const value = formData[field];
  let error: string | null = null;

  switch (field) {
    case 'email':
      error = validateEmail(value);
      break;
    case 'age':
      error = validateAge(value);
      break;
  }

  if (error) {
    setErrors(prev => ({ ...prev, [field]: error }));
  }
};

// Usage
<input
  type="email"
  value={formData.email}
  onChange={(e) => handleChange('email', e.target.value)}
  onBlur={() => handleBlur('email')}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <span id="email-error" className="error-message">
    {errors.email}
  </span>
)}
```

### Input Number Validation Pattern

Handle number inputs with proper validation:

```typescript
const createNumberHandler = (
  field: string,
  min: number,
  max: number
) => ({
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty string for user to clear input
    const value = e.target.value;
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }

    // Update with the typed value (even if out of range)
    setFormData(prev => ({ ...prev, [field]: value }));
  },

  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: min.toString() }));
      return;
    }

    // Clamp to min/max range
    const numValue = parseInt(value, 10);
    const clamped = Math.max(min, Math.min(max, numValue));
    setFormData(prev => ({ ...prev, [field]: clamped.toString() }));
  },
});

// Usage
<input
  type="number"
  value={formData.level}
  {...createNumberHandler('level', 1, 100)}
  min={1}
  max={100}
/>
```

### Loading States

Always show loading indicators for asynchronous operations:

```typescript
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const [data, setData] = useState(null);
const [error, setError] = useState<Error | null>(null);

const fetchData = async () => {
  setStatus('loading');
  setError(null);

  try {
    const response = await api.getData();
    setData(response);
    setStatus('success');
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Unknown error'));
    setStatus('error');
  }
};

// Render
{status === 'loading' && <Spinner />}
{status === 'error' && <ErrorMessage error={error} onRetry={fetchData} />}
{status === 'success' && data && <DataDisplay data={data} />}
```

### Visual Feedback

Provide immediate visual feedback for user actions:

```typescript
const [feedback, setFeedback] = useState<{
  type: 'success' | 'error' | 'info';
  message: string;
} | null>(null);

const showFeedback = (type: typeof feedback.type, message: string) => {
  setFeedback({ type, message });
  setTimeout(() => setFeedback(null), 5000); // Auto-dismiss after 5s
};

// Status card component
{feedback && (
  <div className={`status-card status-${feedback.type}`}>
    <span className="status-icon">
      {feedback.type === 'success' && '✓'}
      {feedback.type === 'error' && '✕'}
      {feedback.type === 'info' && 'i'}
    </span>
    <span>{feedback.message}</span>
    <button onClick={() => setFeedback(null)} aria-label="Dismiss">
      ×
    </button>
  </div>
)}
```

```css
.status-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-success {
  background-color: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.status-error {
  background-color: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.status-info {
  background-color: #d1ecf1;
  border-color: #17a2b8;
  color: #0c5460;
}
```

### Search and Filter Implementation

Implement efficient search/filter with memoization:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

const filteredItems = useMemo(() => {
  if (!searchTerm) return items;

  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term)
  );
}, [items, searchTerm]);

const sortedItems = useMemo(() => {
  return [...filteredItems].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a.date.getTime() - b.date.getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}, [filteredItems, sortBy, sortOrder]);

// UI
<input
  type="search"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search..."
/>
{searchTerm && (
  <button onClick={() => setSearchTerm('')}>Clear</button>
)}

<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
  <option value="name">Name</option>
  <option value="date">Date</option>
</select>

<button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
  {sortOrder === 'asc' ? '↑' : '↓'}
</button>
```

### Debouncing for Performance

Debounce expensive operations like API calls:

```typescript
// hooks/useDebounce.ts
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    searchAPI(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### Keyboard Shortcuts

Implement keyboard shortcuts for power users:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Cmd/Ctrl + K for search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }

    // Escape to close modal
    if (e.key === 'Escape') {
      closeModal();
    }

    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## Accessibility Requirements

### Semantic HTML

Always use semantic HTML elements for better accessibility:

```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>

// Bad
<div className="header">
  <div className="nav">...</div>
</div>

// Good
<header>
  <nav>...</nav>
</header>
```

**Key semantic elements:**
- `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`
- `<section>`, `<article>`
- `<button>` for clickable actions
- `<a>` for navigation links
- `<form>`, `<label>`, `<input>`, `<select>`, `<textarea>`

### ARIA Attributes

Use ARIA attributes to enhance accessibility when semantic HTML isn't sufficient:

```tsx
// Modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Action</h2>
  <p id="modal-description">Are you sure you want to proceed?</p>
</div>

// Custom button with icon
<button aria-label="Close menu">
  <CloseIcon aria-hidden="true" />
</button>

// Tab interface
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'profile'}
    aria-controls="profile-panel"
  >
    Profile
  </button>
  <div
    role="tabpanel"
    id="profile-panel"
    aria-labelledby="profile-tab"
  >
    {/* Content */}
  </div>
</div>

// Status messages
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// Error messages
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Form Accessibility

Make forms fully accessible:

```tsx
<form>
  <div className="form-group">
    <label htmlFor="email">
      Email Address
      <span aria-label="required">*</span>
    </label>
    <input
      id="email"
      type="email"
      required
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? 'email-error' : 'email-help'}
    />
    <span id="email-help" className="help-text">
      We'll never share your email
    </span>
    {errors.email && (
      <span id="email-error" className="error-text" role="alert">
        {errors.email}
      </span>
    )}
  </div>
</form>
```

**Key points:**
- Always use `<label>` with `htmlFor` matching input `id`
- Use `aria-required` for required fields
- Use `aria-invalid` for fields with errors
- Use `aria-describedby` to link help text and error messages
- Use `role="alert"` for error messages

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```typescript
// Custom dropdown that works with keyboard
const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
    }
  };

  return (
    <div className="dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedItem}
      </button>
      {isOpen && (
        <ul role="listbox">
          {items.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Focus Management

Manage focus appropriately, especially in modals and dynamic content:

```typescript
const Modal = ({ isOpen, onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // Focus first element
      (focusableElements?.[0] as HTMLElement)?.focus();
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {/* Modal content */}
    </div>
  );
};
```

### Color Contrast

Ensure sufficient color contrast ratios:

- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text (18pt+ or 14pt+ bold):** Minimum 3:1 contrast ratio
- **UI components and graphics:** Minimum 3:1 contrast ratio

**Tools for checking contrast:**
- Chrome DevTools (Inspect > Accessibility)
- WebAIM Contrast Checker
- Lighthouse accessibility audit

### Alternative Text for Images

Provide meaningful alt text for all images:

```tsx
// Informative images
<img src="chart.png" alt="Sales increased by 25% in Q4 2024" />

// Decorative images
<img src="decorative-line.png" alt="" />

// Functional images (buttons)
<button>
  <img src="save-icon.png" alt="Save document" />
</button>

// Complex images
<img
  src="complex-diagram.png"
  alt="System architecture diagram"
  aria-describedby="diagram-description"
/>
<div id="diagram-description">
  Detailed description of the system architecture...
</div>
```

---

## Performance Optimization

### Memoization Strategies

Use memoization to prevent unnecessary re-renders and recalculations:

#### useMemo for Expensive Computations

```typescript
const expensiveValue = useMemo(() => {
  // Only recalculate when dependencies change
  return items
    .filter(item => item.active)
    .map(item => complexTransform(item))
    .sort((a, b) => a.value - b.value);
}, [items]);
```

#### useCallback for Function References

```typescript
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
  performAction(id);
}, []); // Empty deps = function never changes

const handleUpdate = useCallback((id: string, data: Data) => {
  setItems(prev =>
    prev.map(item => item.id === id ? { ...item, ...data } : item)
  );
}, []); // No dependencies needed due to functional update
```

#### React.memo for Component Memoization

```typescript
const ListItem = React.memo<ListItemProps>(({ item, onSelect }) => {
  return (
    <div onClick={() => onSelect(item.id)}>
      {item.name}
    </div>
  );
});

// With custom comparison function
const ListItem = React.memo<ListItemProps>(
  ({ item, onSelect }) => {/* ... */},
  (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id &&
           prevProps.item.name === nextProps.item.name;
  }
);
```

### Code Splitting

Split code to reduce initial bundle size:

```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}

// Lazy load heavy components
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Analytics() {
  return (
    <div>
      <h1>Analytics</h1>
      <Suspense fallback={<div>Loading chart...</div>}>
        <HeavyChart data={data} />
      </Suspense>
    </div>
  );
}
```

### Image Optimization

Optimize images for web:

```tsx
// Lazy loading with native attribute
<img
  src="large-image.jpg"
  alt="Description"
  loading="lazy"
  decoding="async"
/>

// Responsive images
<img
  src="image-large.jpg"
  srcSet="
    image-small.jpg 480w,
    image-medium.jpg 768w,
    image-large.jpg 1200w
  "
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
  alt="Description"
/>

// Modern formats with fallbacks
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <source srcSet="image.avif" type="image/avif" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### Virtual Scrolling

For long lists, implement virtual scrolling:

```typescript
// Using react-window or similar library
import { FixedSizeList } from 'react-window';

const VirtualList = ({ items }: { items: Item[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Debouncing and Throttling

Limit expensive operations:

```typescript
// Debounce - wait for user to stop typing
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Throttle - limit execution rate
const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }) as T,
    [callback, delay]
  );
};

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

const handleScroll = useThrottle(() => {
  console.log('Scrolled');
}, 100);
```

### Bundle Analysis

Regularly analyze bundle size:

```bash
# Add to package.json scripts
"analyze": "vite-bundle-visualizer"

# Or for webpack
"analyze": "webpack-bundle-analyzer dist/stats.json"
```

**Action items from analysis:**
- Remove unused dependencies
- Use tree-shakeable imports: `import { specific } from 'library'`
- Consider lighter alternatives for heavy libraries
- Split large dependencies into separate chunks

---

## Code Quality Standards

### TypeScript Best Practices

#### Strict Type Definitions

```typescript
// Define clear interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  preferences?: UserPreferences; // Optional properties
}

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
}

// Use type unions for specific values
type Status = 'idle' | 'loading' | 'success' | 'error';

// Generic types for reusable components
interface SelectProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
}
```

#### Avoid `any`

```typescript
// Bad
const handleData = (data: any) => {
  // TypeScript can't help you here
};

// Good - use unknown and narrow the type
const handleData = (data: unknown) => {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  } else if (isUser(data)) {
    console.log(data.name);
  }
};

// Type guard
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

### Consistent Code Style

Use ESLint and Prettier for consistent code formatting:

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 90
}
```

### Naming Conventions

Follow consistent naming:

- **Components:** PascalCase (`UserProfile`, `DataTable`)
- **Functions/variables:** camelCase (`getUserData`, `isLoading`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Interfaces/Types:** PascalCase (`UserData`, `ApiResponse`)
- **CSS classes:** kebab-case (`user-profile`, `data-table`)
- **Files:** Match the primary export (`UserProfile.tsx`, `useAuth.ts`)

### Function Organization

Organize functions logically:

```typescript
const Component = () => {
  // 1. Hooks (useState, useEffect, etc.)
  const [state, setState] = useState(initial);
  const context = useContext(SomeContext);
  const ref = useRef<HTMLDivElement>(null);

  // 2. Derived values
  const derivedValue = useMemo(() => compute(state), [state]);

  // 3. Event handlers
  const handleClick = useCallback(() => {
    setState(newState);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    await submitData();
  }, []);

  // 4. Side effects
  useEffect(() => {
    fetchData();
  }, []);

  // 5. Render helpers (if needed)
  const renderItem = (item: Item) => (
    <div key={item.id}>{item.name}</div>
  );

  // 6. Return JSX
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Comments and Documentation

Write clear comments for complex logic:

```typescript
// Good comments explain WHY, not WHAT
// Bad: Increment counter by 1
// Good: Track the number of failed retry attempts
const retryCount = failedAttempts + 1;

// Document complex algorithms
/**
 * Calculates experience points needed for the target level.
 * Uses the Pokémon experience formula based on growth rate.
 *
 * @param level - Target level (1-100)
 * @param growthRate - One of: slow, medium-slow, medium-fast, fast
 * @returns Total experience points required
 */
const calculateExpForLevel = (
  level: number,
  growthRate: GrowthRate
): number => {
  // Implementation
};

// Comment complex business logic
// Lock the original trainer ID and secret ID to prevent
// the game from treating this as a traded Pokémon,
// which would affect obedience and experience gain
const isLocked = (field: string) =>
  field === 'tid' || field === 'sid';
```

### DRY Principle (Don't Repeat Yourself)

Extract repeated logic into reusable utilities:

```typescript
// Bad - repeated validation logic
const handleNameChange = (name: string) => {
  if (name.length > 50) return;
  if (!/^[a-zA-Z0-9 ]+$/.test(name)) return;
  setName(name);
};

const handleDescriptionChange = (desc: string) => {
  if (desc.length > 50) return;
  if (!/^[a-zA-Z0-9 ]+$/.test(desc)) return;
  setDescription(desc);
};

// Good - extracted to utility
const validateAlphanumeric = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength && /^[a-zA-Z0-9 ]+$/.test(value);
};

const createTextHandler = (
  setter: (value: string) => void,
  maxLength: number
) => (value: string) => {
  if (validateAlphanumeric(value, maxLength)) {
    setter(value);
  }
};

const handleNameChange = createTextHandler(setName, 50);
const handleDescriptionChange = createTextHandler(setDescription, 50);
```

---

## Error Handling & Resilience

### Try-Catch for Async Operations

Always wrap async operations in try-catch:

```typescript
const fetchUserData = async (userId: string) => {
  try {
    setStatus('loading');
    const response = await api.getUser(userId);
    setUser(response.data);
    setStatus('success');
  } catch (error) {
    console.error('Failed to fetch user:', error);
    setError(error instanceof Error ? error : new Error('Unknown error'));
    setStatus('error');
  }
};
```

### Error Boundaries

Implement error boundaries for graceful error handling:

```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Network Resilience

Handle network failures gracefully:

```typescript
// Image loading with fallback
<img
  src={primaryImageUrl}
  alt={description}
  onError={(e) => {
    const target = e.currentTarget;

    // Try fallback URL
    if (target.src === primaryImageUrl) {
      target.src = fallbackImageUrl;
    } else {
      // Use placeholder if fallback also fails
      target.src = placeholderImageUrl;
    }
  }}
/>

// API retry logic
const fetchWithRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
};

// Usage
const data = await fetchWithRetry(() => api.getData(), 3);
```

### User-Friendly Error Messages

Display helpful error messages:

```typescript
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Validation errors
    if (error.message.includes('validation')) {
      return 'Please check your input and try again.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Display
{error && (
  <div className="error-message" role="alert">
    <strong>Error:</strong> {getErrorMessage(error)}
    <button onClick={handleRetry}>Try Again</button>
  </div>
)}
```

### Form Submission Error Handling

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);

  try {
    const result = await api.submitForm(formData);

    // Success feedback
    showNotification('success', 'Form submitted successfully!');

    // Reset form or redirect
    resetForm();

  } catch (error) {
    if (error instanceof ValidationError) {
      // Show field-specific errors
      setFieldErrors(error.fieldErrors);
    } else if (error instanceof NetworkError) {
      setError('Network error. Please check your connection and try again.');
    } else {
      setError('Failed to submit form. Please try again later.');
    }
  } finally {
    setSubmitting(false);
  }
};
```

---

## Testing Considerations

### Unit Testing Components

Write tests for components using React Testing Library:

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('applies variant class', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('button-primary');
  });
});
```

### Testing Hooks

Test custom hooks:

```typescript
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('respects max value', () => {
    const { result } = renderHook(() => useCounter(0, 5));

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.increment();
      }
    });

    expect(result.current.count).toBe(5);
  });
});
```

### Integration Testing

Test component interactions:

```typescript
// Form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('submits form with valid data', async () => {
    const handleSubmit = jest.fn();
    render(<ContactForm onSubmit={handleSubmit} />);

    // Fill out form
    await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(screen.getByLabelText('Message'), 'Hello world');

    // Submit
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world',
      });
    });
  });

  it('shows validation errors for invalid email', async () => {
    render(<ContactForm onSubmit={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Email'), 'invalid-email');
    fireEvent.blur(screen.getByLabelText('Email'));

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });
});
```

### Accessibility Testing

Test for accessibility:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Test Coverage Goals

Aim for:
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

**Priority areas:**
1. Business logic and utilities (100%)
2. Critical user paths (90%+)
3. Error handling (85%+)
4. UI components (75%+)

---

## Summary

When creating web applications, prioritize:

1. **Mobile-first responsive design** with clear breakpoints
2. **Type safety** through TypeScript
3. **Component-based architecture** with clear separation of concerns
4. **Accessibility** through semantic HTML, ARIA, and keyboard support
5. **Performance** through memoization, code splitting, and optimization
6. **User experience** with loading states, error handling, and visual feedback
7. **Code quality** with consistent style, clear naming, and proper documentation
8. **Resilience** through error boundaries, retry logic, and graceful degradation

These guidelines ensure applications are maintainable, accessible, performant, and provide excellent user experiences across all devices and screen sizes.
