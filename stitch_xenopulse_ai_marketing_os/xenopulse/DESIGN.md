---
name: XenoPulse
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-sm:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  mono-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  xxl: 4rem
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The brand identity centers on "Operational Intelligence"—the intersection of complex AI processing and effortless retail execution. The design system prioritizes clarity, performance, and a premium enterprise feel. It targets marketing directors and retail executives who require high-density information presented with high-fidelity aesthetics.

The visual style is **Modern SaaS / Minimalist**, characterized by:
- **Functional Precision:** Every pixel serves a purpose, drawing inspiration from developer-centric tools like Linear.
- **Atmospheric Depth:** Using subtle gradients and glassmorphism to create a sense of sophisticated layering.
- **Data-First Hierarchy:** Prioritizing information legibility through generous whitespace and a "less is more" approach to chrome and decorative elements.
- **Dual-Mode Excellence:** A seamless transition between a high-productivity light mode and a focused, premium dark mode.

## Colors

The palette is anchored by **Electric Indigo** and **Vivid Purple**, representing the "Pulse" of the AI. These are used sparingly for primary actions, active states, and brand-defining moments. 

- **Primary & Secondary:** A gradient bridge between Indigo (#6366F1) and Purple (#A855F7) is used for high-impact data visualizations and primary buttons.
- **Neutral/Slate:** A refined scale of grays and slates handles the UI framework, ensuring that the brand colors pop against a professional backdrop.
- **Accents:** Emerald (#10B981) is reserved for "Success" states and positive growth metrics, while Blue (#3B82F6) handles informational signals.
- **System States:** Error (Rose), Warning (Amber), and Info (Blue) follow standard enterprise patterns but are desaturated to maintain the minimal aesthetic.

## Typography

This design system utilizes a dual-font strategy to balance technical precision with extreme readability.

1.  **Geist:** Used for headlines, display metrics, and labels. Its geometric construction provides the "Modern SaaS" feel. Tight letter-spacing should be applied to larger sizes for a premium, editorial look.
2.  **Inter:** The workhorse for all body copy and data entry. Its high x-height ensures clarity in data-dense marketing tables and reports.

**Responsive Adjustments:** On mobile devices, `display-lg` scales down to 32px, and `headline-lg` scales to 20px. Navigation labels remain at 12px for maximum screen real estate.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The main application dashboard utilizes a sidebar-nav layout with a fluid content area, while marketing landing pages and report summaries are centered within a 1440px container.

- **Grid:** A 12-column grid is used for dashboard layouts. Gutters are fixed at 24px to provide "breathing room" between complex data widgets.
- **Rhythm:** An 8pt linear scale governs all spacing.
- **Density:** The design system supports a "Compact" mode for power users (reducing padding by 25%) and a "Spacious" mode for executive presentations (increasing padding by 50%).
- **Mobile:** Elements reflow to a single column with 16px side margins. Horizontal scrolling is permitted for data tables with "sticky" first columns.

## Elevation & Depth

Depth is used to signify focus and hierarchy, avoiding heavy shadows in favor of light-based metaphors.

- **Surface Layers:** The background is the lowest level (Level 0). Cards and primary content containers sit on Level 1, using a subtle 1px border (`border-white/10` in dark mode).
- **Glassmorphism Accents:** Modals, dropdown menus, and sticky headers use a backdrop blur (12px to 20px) with a semi-transparent surface (e.g., `rgba(255, 255, 255, 0.05)`).
- **Shadows:** Only used on Level 2 (Floating elements like Popovers or Modals). Shadows are large, highly diffused, and tinted with the primary indigo hex at 5% opacity to avoid a "dirty" look.
- **Interaction:** On hover, cards may lift slightly using a subtle inner-glow effect (1px top-border highlight).

## Shapes

The shape language reflects the "Premium" positioning. 

- **Cards:** Use `rounded-xl` (1rem) as the standard, with `rounded-2xl` (1.5rem) reserved for major dashboard sections and marketing highlights.
- **Buttons & Inputs:** Use a standard `rounded-md` (0.5rem) to maintain a professional, architectural feel.
- **Status Indicators:** Chips and badges use a pill-shape (full radius) to contrast against the structured grid of the UI.

## Components

- **Buttons:** Primary buttons use a subtle Indigo-to-Purple gradient with white text. Secondary buttons use a "Ghost" style with a 1px border.
- **Data Tables:** High-density, borderless design. Row separation is achieved via hover-state background changes. Header cells use `label-sm` in all-caps with increased letter spacing.
- **Cards:** Container for all AI insights. Includes a mandatory 24px internal padding. Glassmorphic headers within cards distinguish between "Input" and "AI Analysis" sections.
- **Input Fields:** Minimalist design with only a bottom border or very light grey fill. Focus states use a 2px Indigo glow.
- **Chips/Badges:** Used for retail category tags. Semi-transparent background fills with high-contrast text.
- **Visualizations:** Charts should use the "Stripe-inspired" style: thin lines, gradient area fills, and no-border tooltips that follow the cursor.
- **Progress Bars:** Thin, 4px height, using the primary gradient to indicate AI processing status.