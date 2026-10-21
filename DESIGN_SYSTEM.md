# Karighar Design System — Warm Minimalism

A design system built for **Karighar**, an Indian marketplace connecting homeowners with skilled trade craftspeople. The design language celebrates craftsmanship: earthy, honest, confident, and human.

---

## 1. Design Philosophy

- **Warm Minimalism:** Soft paper-like surfaces (`#FAF7F4`), 1px warm borders (`#E7DDD5`), and quiet depth through subtle ambient shadows (`rgba(90, 50, 30, 0.06)`).
- **Restraint:** Terracotta is an accent, not a flood (~80% neutrals, ~15% soft terracotta tints, ~5% bold CTA highlights).
- **Anti-AI Slop:** No purple/blue neon glows, no generic floating blobs, no rainbow chips, no nested card boxes, no fake hype copy.
- **Crafted Typography:** Pairing **DM Sans** for utilitarian, legible UI copy with **Fraunces** for warm, editorial headings.
- **Indian Context:** Tuned for Indian currency formatting (₹), local terminology (Karighars, trades, localities), and touch-friendly mobile targets (min 44px).

---

## 2. Color System (Tokens in `src/styles.css`)

All colors are defined as design tokens using CSS variables. **Zero hardcoded hex values in component code.**

### Terracotta Scale (Brand Accent)
| Token | OKLCH Equivalent | Hex Approx | Usage |
|---|---|---|---|
| `--color-terracotta-50` | `oklch(0.975 0.014 52)` | `#FBF3EF` | Surface highlights, tint chips |
| `--color-terracotta-100` | `oklch(0.944 0.030 50)` | `#F5E1D8` | Hover backgrounds, pill fills |
| `--color-terracotta-200` | `oklch(0.890 0.056 47)` | `#EBC3B0` | Muted borders |
| `--color-terracotta-500` | `oklch(0.648 0.148 37)` | `#C0603F` | Icons, active highlights |
| `--color-terracotta-600` | `oklch(0.554 0.163 35)` | `#A44C30` | **Primary CTA buttons, links (AA Pass)** |
| `--color-terracotta-700` | `oklch(0.458 0.148 33)` | `#843D27` | Active / pressed button states |

### Light Neutrals
| Token | Hex Equivalent | Role |
|---|---|---|
| `--background` | `#FAF7F4` | Main page background |
| `--card` / `--surface` | `#FFFFFF` | Card & modal surfaces |
| `--surface-subtle` | `#F3EDE8` | Inset panels, alternate sections |
| `--border` | `#E7DDD5` | 1px dividers, card outlines |
| `--foreground` | `#2A211C` | High-contrast body & heading text |
| `--muted-foreground` | `#7A6B62` | Secondary labels, captions |

### Semantic Colors (Muted & Earthy)
| Token | Color | Hex Equivalent | Usage |
|---|---|---|---|
| `--success` | Earthy sage green | `#5E7F5A` | Completed status, confirmed checks |
| `--warning` | Warm amber | `#C98A2B` | In-progress, scheduled status, emergency tags |
| `--destructive` | Muted terracotta red | `#B3372E` | Errors, cancellations, delete actions |
| `--info` | Slate blue | `#5B7184` | Awaiting quotes, general info |

### Dark Mode (Warm Charcoal, NOT Blue-Gray)
| Token | Color | Hex Equivalent |
|---|---|---|
| `--background` | Deep espresso | `#1A1411` |
| `--card` | Warm charcoal | `#231B17` |
| `--surface-subtle` | Warm inset | `#2C221D` |
| `--border` | Dark earth | `#3A2E27` |
| `--foreground` | Warm off-white | `#F5EDE7` |
| `--muted-foreground` | Sandstone | `#B5A398` |
| `--primary` | Terracotta-400 | `#D07F5E` (optimised for dark surfaces) |

---

## 3. Typography Scale

- **Display & Headings:** `font-display` → **Fraunces** (serif/editorial)
- **Body & Controls:** `font-sans` → **DM Sans** (clean, geometric sans-serif)

| Token / Class | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| `.text-display` | `3.5rem (56px)` | 600 | 1.08 | `-0.03em` | Hero titles |
| `.text-h1` / `h1` | `2.5rem (40px)` | 600 | 1.12 | `-0.025em` | Page titles |
| `.text-h2` / `h2` | `1.875rem (30px)` | 600 | 1.18 | `-0.022em` | Section headers |
| `.text-h3` / `h3` | `1.375rem (22px)` | 600 | 1.25 | `-0.018em` | Card titles |
| `.text-body-lg` | `1.125rem (18px)` | 400/500 | 1.6 | `-0.005em` | Intro paragraphs |
| `.text-body` | `1.0rem (16px)` | 400 | 1.6 | `-0.005em` | Standard copy |
| `.text-body-sm` | `0.875rem (14px)` | 400/500 | 1.55 | `0` | Card copy, table rows |
| `.text-caption` | `0.75rem (12px)` | 400/500 | 1.5 | `+0.01em` | Meta, timestamps |
| `.text-label` | `0.75rem (12px)` | 600 | 1.4 | `+0.04em` | Uppercase section badges |

---

## 4. Spacing, Radii & Depth

### 4pt / 8pt Spacing Grid
- `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`

### Corner Radii
- `rounded-md` (`8px`): Small buttons, chips, nested inputs
- `rounded-lg` (`12px`): Standard controls, cards, popovers
- `rounded-xl` (`20px`): Outer cards, dialogs, image thumbnails
- `rounded-2xl` (`28px`): Featured containers, hero sections
- `rounded-full` (`9999px`): Filter pills, status badges, avatars

### Depth System (Warm Shadows)
```css
.shadow-warm-xs { box-shadow: 0 1px 2px rgba(90, 50, 30, 0.06); }
.shadow-warm-sm { box-shadow: 0 1px 3px rgba(90, 50, 30, 0.06), 0 4px 12px rgba(90, 50, 30, 0.06); }
.shadow-warm    { box-shadow: 0 1px 3px rgba(90, 50, 30, 0.06), 0 8px 24px rgba(90, 50, 30, 0.08); }
.shadow-warm-lg { box-shadow: 0 2px 4px rgba(90, 50, 30, 0.05), 0 12px 40px rgba(90, 50, 30, 0.10); }
```

---

## 5. Reusable Component Library

### 1. `Button` (`@/components/ui/button`)
- **`default`**: Primary terracotta CTA (`bg-primary text-primary-foreground`)
- **`outline`**: 1px border on warm background (`border border-border bg-background`)
- **`secondary`**: Muted fill (`bg-surface-subtle text-foreground`)
- **`warm`**: Soft terracotta tint (`bg-primary/10 text-primary`)
- **`ghost`**: Hover background only
- **Sizes**: `sm` (h-8), `default` (h-10), `lg` (h-12), `xl` (h-14)
- **Interactive**: `hover:-translate-y-0.5 active:scale-[0.97]`

### 2. `Input` & `Textarea` (`@/components/ui/input`, `@/components/ui/textarea`)
- Consistent 11-unit (`44px`) minimum touch target height
- Smooth terracotta focus ring (`focus-visible:ring-primary/20 focus-visible:border-primary`)
- Subtle border hover highlight

### 3. `Badge` (`@/components/ui/badge`)
5 disciplined, non-rainbow semantic variants:
- **`default`**: Brand terracotta accent (`bg-primary/12 text-primary border-primary/20`)
- **`secondary`**: Warm neutral (`bg-surface-subtle text-muted-foreground`)
- **`success`**: Earthy sage (`bg-success-soft text-success`)
- **`warning`**: Warm amber (`bg-warning-soft text-warning`)
- **`destructive`**: Earthy red (`bg-destructive/10 text-destructive`)
- **`info`**: Muted slate (`bg-info-soft text-info`)

### 4. `Card` (`@/components/ui/card`)
- 1px border + `shadow-warm-xs` + clean spacing

### 5. `Skeleton` (`@/components/ui/skeleton`)
- Warm surface pulse animation (`bg-surface-subtle`) instead of harsh gray spinners

### 6. Shell Components (`@/components/karighar-shell`)
- **`Brand`**: Handcrafted architectural house monogram + clean wordmark
- **`SiteHeader`**: Sticky header with category indicators, search shortcut, and dropdown menu
- **`PageShell`**: Standard application frame with header, main content slot, and footer
- **`SectionHeader`**: Clean editorial shelf header with "See all" chevron link
- **`TrustBadge`**: Standardized checkmark verification pill

---

## 6. Do's and Don'ts

| Do | Don't |
|---|---|
| Use `bg-background` for the warm paper feel | Use pure white `#FFF` or pure black `#000` for canvas |
| Keep one clear primary action per screen | Clutter cards with 3 competing bright buttons |
| Use size, weight, and whitespace for visual hierarchy | Wrap everything inside cards inside cards |
| Use Lucide icons at `strokeWidth={1.5}` | Mix icon packs or use emojis as UI icons |
| Use the 5 defined `Badge` variants for statuses | Use rainbow tailwind colors (`bg-purple-500`, `bg-blue-600`) |
| Format prices with Indian Rupee symbol `₹` | Hardcode dollar signs or omit locale commas |
