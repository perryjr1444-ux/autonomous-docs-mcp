# Custom Theme Integration

Create and apply custom themes with brand colors, logos, and styling.

## Quick Start

```bash
# Copy theme template
cp -r examples/custom-theme/template themes/my-theme

# Customize colors
edit themes/my-theme/colors.json

# Add brand assets
cp logo.svg themes/my-theme/assets/

# Apply theme
node apply-theme.js themes/my-theme
```

## Theme Structure

```
themes/my-theme/
├── theme.json      # Main configuration
├── colors.json     # Color palette
├── fonts.json      # Typography
├── assets/
│   ├── logo.svg
│   ├── logo-dark.svg
│   ├── favicon.ico
│   └── og-image.png
└── components/     # Custom React components (optional)
    ├── Header.tsx
    ├── Footer.tsx
    └── CodeBlock.tsx
```

## Customization

### Colors

`colors.json`:
```json
{
  "primary": "#0D9373",
  "primaryDark": "#0A7A5E",
  "primaryLight": "#10B891",
  "background": "#FFFFFF",
  "backgroundDark": "#0F172A",
  "text": "#1F2937",
  "textSecondary": "#6B7280",
  "accent": "#F59E0B",
  "success": "#10B981",
  "error": "#EF4444"
}
```

### Typography

`fonts.json`:
```json
{
  "heading": "Inter, sans-serif",
  "body": "Inter, sans-serif",
  "code": "Fira Code, monospace",
  "sizes": {
    "h1": "2.5rem",
    "h2": "2rem",
    "h3": "1.5rem",
    "body": "1rem",
    "small": "0.875rem"
  }
}
```

### Theme Configuration

`theme.json`:
```json
{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "description": "Custom brand theme",
  "colors": "./colors.json",
  "fonts": "./fonts.json",
  "assets": {
    "logo": "./assets/logo.svg",
    "logoDark": "./assets/logo-dark.svg",
    "favicon": "./assets/favicon.ico",
    "ogImage": "./assets/og-image.png"
  },
  "components": {
    "header": "./components/Header.tsx",
    "footer": "./components/Footer.tsx",
    "codeBlock": "./components/CodeBlock.tsx"
  }
}
```

## Application

### Automatic

```bash
node apply-theme.js themes/my-theme
```

This updates `docs/docs.json` with your theme settings.

### Manual

Edit `docs/docs.json`:
```json
{
  "name": "My Project",
  "logo": {
    "light": "/themes/my-theme/assets/logo.svg",
    "dark": "/themes/my-theme/assets/logo-dark.svg"
  },
  "favicon": "/themes/my-theme/assets/favicon.ico",
  "colors": {
    "primary": "#0D9373",
    "light": "#10B891",
    "dark": "#0A7A5E",
    "background": {
      "light": "#FFFFFF",
      "dark": "#0F172A"
    }
  },
  "font": {
    "headings": "Inter",
    "body": "Inter",
    "code": "Fira Code"
  }
}
```

## Testing

```bash
cd docs
mintlify dev
```

Open http://localhost:3000 to see your theme.
