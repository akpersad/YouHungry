# Design System & Visual Identity

This document defines the visual design system, color palette, typography, and component guidelines for the You Hungry? app.

## 🎨 Color Palette: Warm & Earthy

### **Primary Colors (for backgrounds/headings)**

- **Rich Green**: `#386641` - Primary brand color, main CTAs, primary buttons
- **Earthy Brown**: `#6f4e37` - Secondary elements, supporting content
- **Deep Red**: `#9a2229` - Accent color, important actions, highlights

### **Secondary Colors (for accents/buttons)**

- **Warm Yellow**: `#ffd23f` - Accent buttons, highlights, call-to-action elements
- **Creamy Off-white**: `#fff8e1` - Main background color, subtle surfaces

### **Text Colors**

- **Dark Gray/Black**: `#222222` - Primary text, headings, high contrast elements
- **Pure White**: `#ffffff` - Text on dark backgrounds, contrast text
- **Text Light**: `#4a4a4a` - Secondary text, descriptions
- **Text Muted**: `#6b6b6b` - Muted text, captions, metadata

### **Background Colors**

- **Main Background**: `#fff8e1` - Creamy off-white, primary background
- **Surface**: `#ffffff` - Cards, modals, elevated surfaces
- **Surface Light**: `#fafafa` - Subtle surface variations
- **Surface Dark**: `#f5f5f5` - Darker surface for contrast

### **Border Colors**

- **Border**: `#e0e0e0` - Standard borders, dividers
- **Border Light**: `#f0f0f0` - Subtle borders, separators
- **Border Dark**: `#d0d0d0` - Stronger borders, emphasis

## 📐 Typography Scale

### **Font Stack**

- **Sans Serif**: Geist Sans (primary) - Modern, readable, optimized for screens
- **Monospace**: Geist Mono - Code blocks, technical content

### **Type Scale** (Tailwind CSS classes)

```css
/* Headings */
.text-4xl    /* 36px - Main page titles */
/* 36px - Main page titles */
.text-3xl    /* 30px - Section headings */
.text-2xl    /* 24px - Subsection titles */
.text-xl     /* 20px - Card titles */

/* Body Text */
.text-lg     /* 18px - Large body text, introductions */
.text-base   /* 16px - Standard body text */
.text-sm     /* 14px - Secondary text, captions */
.text-xs; /* 12px - Fine print, metadata */
```

### **Font Weight Scale**

- **Light**: `font-light` (300) - Subtle text
- **Regular**: `font-normal` (400) - Body text
- **Medium**: `font-medium` (500) - Emphasis
- **Semibold**: `font-semibold` (600) - Headings, buttons
- **Bold**: `font-bold` (700) - Strong emphasis

## 🎯 Component Patterns

### **Buttons**

```css
/* Primary Button */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-white);
  @apply px-6 py-3 rounded-lg font-medium;
  @apply hover:bg-primary-dark transition-colors;
  @apply focus:ring-2 focus:ring-primary focus:ring-offset-2;
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-text-white);
  @apply px-6 py-3 rounded-lg font-medium;
  @apply hover:bg-secondary-dark transition-colors;
  @apply focus:ring-2 focus:ring-secondary focus:ring-offset-2;
}

/* Accent Button */
.btn-accent {
  background-color: var(--color-accent);
  color: var(--color-text-white);
  @apply px-6 py-3 rounded-lg font-medium;
  @apply hover:bg-accent-dark transition-colors;
  @apply focus:ring-2 focus:ring-accent focus:ring-offset-2;
}

/* Warm Button */
.btn-warm {
  background-color: var(--color-warm-yellow);
  color: var(--color-text);
  @apply px-6 py-3 rounded-lg font-medium;
  @apply hover:bg-warm-yellow-dark transition-colors;
  @apply focus:ring-2 focus:ring-warm-yellow focus:ring-offset-2;
}
```

### **Cards**

```css
.card {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  @apply rounded-xl shadow-sm border p-6;
  @apply hover:shadow-md transition-shadow;
}

.card-elevated {
  @apply shadow-md;
}
```

### **Form Inputs**

```css
/* Input Fields */
.input-field {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
  @apply w-full px-4 py-3 border rounded-lg focus:ring-2;
  @apply focus:border-transparent transition-colors duration-200;
}

.input-field:focus {
  border-color: var(--color-primary);
  --tw-ring-color: var(--color-primary);
  --tw-ring-opacity: 0.2;
}

.input-field::placeholder {
  color: var(--color-text-muted);
}

.input-field-error {
  @apply border-red-500;
}

/* Textarea */
.textarea-field {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
  @apply w-full px-4 py-3 border rounded-lg focus:ring-2 resize-vertical;
  @apply focus:border-transparent transition-colors duration-200;
}

.textarea-field:focus {
  border-color: var(--color-primary);
  --tw-ring-color: var(--color-primary);
  --tw-ring-opacity: 0.2;
}

/* Select Dropdown */
.select-field {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
  @apply w-full px-4 py-3 border rounded-lg focus:ring-2;
  @apply focus:border-transparent transition-colors duration-200;
}

.select-field:focus {
  border-color: var(--color-primary);
  --tw-ring-color: var(--color-primary);
  --tw-ring-opacity: 0.2;
}
```

### **Navigation**

```css
.nav-link {
  @apply px-3 py-2 rounded-md text-sm font-medium transition-colors;
}

.nav-link-active {
  background-color: var(--color-surface);
  color: var(--color-text);
  @apply shadow-sm border;
  border-color: var(--color-border);
}

.nav-link-inactive {
  color: var(--color-text);
  @apply hover:bg-surface/50 transition-colors;
}
```

## 📱 Responsive Breakpoints

### **Tailwind CSS Breakpoints**

- **Mobile**: `default` (0px+) - Mobile-first design
- **Tablet**: `sm:` (640px+) - Small tablets, large phones
- **Desktop**: `md:` (768px+) - Tablets, small laptops
- **Large Desktop**: `lg:` (1024px+) - Desktop monitors
- **Extra Large**: `xl:` (1280px+) - Large monitors

### **Layout Patterns**

```css
/* Container Widths */
.container-sm  /* max-w-2xl (672px) - Text content */
.container-md  /* max-w-4xl (896px) - Standard pages */
.container-lg  /* max-w-6xl (1152px) - Wide layouts */

/* Responsive Grid */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Responsive Flex */
.flex-responsive {
  @apply flex flex-col md:flex-row items-center gap-4;
}
```

## ♿ Accessibility Guidelines

### **Color Contrast Requirements**

- **WCAG AA**: 4.5:1 minimum contrast ratio ✅ ACHIEVED
- **WCAG AAA**: 7:1 enhanced contrast ratio (target for next iteration)
- **Interactive elements**: Must meet 4.5:1 minimum

### **Contrast Validation**

All color combinations tested and verified:

- **Primary text on creamy background**: High contrast ratio ✅
- **White text on rich green**: 4.5:1+ ratio ✅
- **White text on earthy brown**: 4.5:1+ ratio ✅
- **White text on deep red**: 4.5:1+ ratio ✅
- **Dark text on warm yellow**: High contrast ratio ✅
- **Form inputs on white**: Enhanced contrast for better visibility ✅

### **Interactive States**

```css
/* Focus States */
.focus-visible {
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  --tw-ring-color: var(--color-primary);
}

/* Hover States */
.hover-lift {
  @apply hover:shadow-md hover:-translate-y-0.5 transition-all duration-200;
}

/* Active States */
.active-press {
  @apply active:scale-95 transition-transform;
}
```

## 🎭 Visual Identity

### **Professional Characteristics**

- **Warm & Inviting**: Creamy backgrounds, warm color palette
- **Trustworthy**: Earthy, natural color palette with food-friendly tones
- **Technical**: Precise spacing, consistent patterns
- **Accessible**: High contrast, keyboard navigation

### **Brand Personality**

- **Food-Focused**: Colors that evoke appetite and dining
- **Reliability**: Consistent design patterns
- **Innovation**: Modern tech stack and tooling
- **Collaboration**: Clear communication through design

### **Visual Hierarchy**

1. **Hero/CTA elements**: Highest contrast, largest scale
2. **Navigation**: Clear, accessible, persistent
3. **Content headings**: Consistent scale progression
4. **Body content**: Optimized for readability
5. **Metadata/details**: Subtle but discoverable
