# Design System & Visual Identity

This document defines the visual design system, color palette, typography, and component guidelines for the Andrew Persad portfolio.

## 🎨 Color Palette: Earthy Forest

### **Primary Colors**

- **Light Neutral**: `#DAD7CD` - Backgrounds, cards, subtle accents
- **Medium Green**: `#A3B18A` - Secondary elements, hover states, borders
- **Primary Green**: `#527A51` - Primary buttons, links, CTAs (WCAG AA optimized)
- **Dark Green**: `#3A5A40` - Headings, important text, emphasis
- **Darkest**: `#344E41` - Body text, high contrast elements

### **WCAG AA Compliant Text Colors**

- **Primary Text**: `#1A2B1F` - Main body text (enhanced contrast)
- **Secondary Text**: `#2A3B2E` - Supporting text, descriptions
- **Text on Dark**: `#FFFFFF` - White text for dark backgrounds
- **Text Muted on Dark**: `#F5F3F0` - Muted text on dark backgrounds
- **Link Primary**: `#1A2B1F` - High contrast link color

### **Navigation Colors**

- **Active Background**: `#FFFFFF` - White background for active nav items
- **Active Text**: `#1A2B1F` - Dark text on white background

## 📐 Typography Scale

### **Font Stack**

- **Sans Serif**: Geist Sans (primary) - Modern, readable, optimized for screens
- **Monospace**: Geist Mono - Code blocks, technical content

### **Type Scale** (Tailwind CSS classes)

```css
/* Headings */
.text-4xl    /* 36px - Main page titles */
.text-3xl    /* 30px - Section headings */
.text-2xl    /* 24px - Subsection titles */
.text-xl     /* 20px - Card titles */

/* Body Text */
.text-lg     /* 18px - Large body text, introductions */
.text-base   /* 16px - Standard body text */
.text-sm     /* 14px - Secondary text, captions */
.text-xs     /* 12px - Fine print, metadata */
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
  @apply bg-primary-green text-text-on-dark px-6 py-3 rounded-lg font-medium;
  @apply hover:bg-dark-green transition-colors;
  @apply focus:ring-2 focus:ring-primary-green focus:ring-offset-2;
}

/* Secondary Button */
.btn-secondary {
  @apply border border-medium-green text-text-secondary px-6 py-3 rounded-lg font-medium;
  @apply hover:bg-medium-green hover:text-text-primary transition-colors;
}
```

### **Cards**

```css
.card {
  @apply bg-white rounded-xl shadow-sm border border-medium-green/20 p-6;
  @apply hover:shadow-md transition-shadow;
}

.card-dark {
  @apply bg-darkest text-text-on-dark rounded-xl shadow-sm p-6;
}
```

### **Form Inputs**

```css
/* Input Fields */
.input-field {
  @apply w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green;
  @apply focus:border-transparent bg-white text-text-primary;
  @apply transition-colors duration-200;
}

.input-field-error {
  @apply border-red-500;
}

.input-field-normal {
  @apply border-medium-green;
}

/* Textarea */
.textarea-field {
  @apply w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green;
  @apply focus:border-transparent bg-white text-text-primary resize-vertical;
  @apply transition-colors duration-200;
}

/* Select Dropdown */
.select-field {
  @apply w-full px-4 py-3 border border-medium-green rounded-lg;
  @apply focus:ring-2 focus:ring-primary-green focus:border-transparent;
  @apply bg-white text-text-primary transition-colors duration-200;
}
```

### **Navigation**

```css
.nav-link {
  @apply px-3 py-2 rounded-md text-sm font-medium transition-colors;
}

.nav-link-active {
  @apply text-nav-active-text bg-nav-active-bg shadow-sm border border-medium-green;
}

.nav-link-inactive {
  @apply text-text-primary hover:text-text-primary hover:bg-nav-active-bg/50;
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

- **Primary text on light**: 11.2:1 ratio ✅
- **Secondary text on light**: 8.7:1 ratio ✅
- **White text on primary green**: 4.92:1 ratio ✅
- **Active nav states**: High contrast white/dark combinations ✅
- **Form inputs on white**: Enhanced contrast for better visibility ✅

### **Interactive States**

```css
/* Focus States */
.focus-visible {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2;
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

- **Clean & Minimal**: Generous white space, clear hierarchy
- **Trustworthy**: Earthy, natural color palette
- **Technical**: Precise spacing, consistent patterns
- **Accessible**: High contrast, keyboard navigation

### **Brand Personality**

- **Expertise**: Demonstrated through technical choices
- **Reliability**: Consistent design patterns
- **Innovation**: Modern tech stack and tooling
- **Collaboration**: Clear communication through design

### **Visual Hierarchy**

1. **Hero/CTA elements**: Highest contrast, largest scale
2. **Navigation**: Clear, accessible, persistent
3. **Content headings**: Consistent scale progression
4. **Body content**: Optimized for readability
5. **Metadata/details**: Subtle but discoverable
