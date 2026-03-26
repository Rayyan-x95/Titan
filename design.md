# Design System Document: The Neon-Editorial Experience

## 1. Overview & Creative North Star
### Creative North Star: "The Ethereal Vault"
This design system is not a standard utility; it is a premium digital environment designed for a generation that views finance as both a lifestyle and an identity. We move away from the rigid, "bank-like" spreadsheets of the past and toward an **Ethereal Vault**—a space that feels high-tech, secure, and deeply immersive.

The "template" look is intentionally dismantled through:
* **Intentional Asymmetry:** Breaking the vertical axis to create a sense of forward motion.
* **Depth through Diffusion:** Replacing flat cards with layered "glass" surfaces and soft, neon light leaks.
* **Typography as Architecture:** Using extreme contrast in font scales to guide the eye through an editorial narrative rather than a simple data table.

## 2. Colors & Surface Philosophy

Our palette is built on a "Deep Sea" foundation with high-energy neon accents. It is designed to be viewed on OLED screens, where true blacks and vibrant glows create maximum impact.

### Color Tokens (Material Design Mapping)
* **Background (`#0a0e19`):** The canvas. Deep, dark, and infinite.
* **Primary (`#afa2ff`):** Electric Purple. Used for key actions and brand presence.
* **Secondary (`#00cffc`):** Neon Blue. Used for secondary signals and progress.
* **Tertiary (`#58ffd7`):** Aqua Teal. Used for positive financial growth and "Success" states.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts.
* Use `surface-container-low` for large content areas sitting on a `surface` background.
* Use `surface-container-highest` for interactive elements to provide a natural "lift."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent glass sheets.
1. **Level 0 (Base):** `surface` (`#0a0e19`)
2. **Level 1 (Sectioning):** `surface-container-low` (`#0f131f`)
3. **Level 2 (Cards):** `surface-container` (`#141927`)
4. **Level 3 (Interactive/Floating):** `surface-bright` (`#262c3d`)

### The "Glass & Gradient" Rule
To achieve a "Titan" signature look, use **Backdrop Blur** (20px to 40px) on any surface that floats above the background. Main CTAs should not be flat; use a linear gradient from `primary` (`#afa2ff`) to `primary-dim` (`#7459f7`) at a 135-degree angle to provide "soul" and professional polish.

## 3. Typography
We use a dual-font system to balance high-end editorial flair with functional legibility.

* **Display & Headlines (Plus Jakarta Sans):** Our "Confidence" voice. This font features modern geometric curves that feel futuristic. Use `display-lg` (3.5rem) for balance amounts—it should feel massive, unapologetic, and centered.
* **Body & Titles (Manrope):** Our "Human" voice. Manrope provides excellent readability at small sizes while maintaining a tech-forward aesthetic.

**Visual Identity Tip:** Use `label-sm` with `0.1em` letter-spacing in all-caps for metadata to create a "technical readout" feel that Gen Z associates with premium fintech.

## 4. Elevation & Depth
Depth is not a shadow; it is a light source.

### The Layering Principle
Achieve hierarchy by "stacking" surface tiers. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural "recessed" look.

### Ambient Shadows & Neon Glows
Standard dark grey shadows are forbidden.
* **Floating Elements:** Use extra-diffused shadows (Blur: 30px+) at 8% opacity. The shadow color must be a tinted version of `primary` or `secondary` to mimic light reflecting off a neon surface.
* **Neon Edge Glows:** On primary cards, use a subtle inner-glow or a `0.5px` border with `outline-variant` at 20% opacity to catch the light.

### Glassmorphism
For floating navigation or modal overlays, use `surface-variant` with a `0.6` alpha and a `Blur: 25px`. This keeps the context of the app visible underneath, making the layout feel integrated rather than "pasted on."

## 5. Components

### Buttons
* **Primary:** Gradient (`primary` to `primary-container`), `xl` (1.5rem) rounded corners. Minimal text.
* **Secondary:** Ghost style. `outline-variant` (20% opacity) border with `on-surface` text.
* **State:** On press, apply a soft glow effect using the `surface-tint` color.

### Soft Cards
* **Rule:** Forbid the use of divider lines inside cards. Use vertical white space (Scale `8` or `10`) to separate content.
* **Visual:** Cards should use `surface-container-high` with a subtle `2px` top-edge glow in `primary-fixed-dim`.

### Input Fields
* **Style:** Minimalist. No bottom line. Use `surface-container-lowest` as a subtle recessed background.
* **Active State:** The "Ghost Border" becomes 100% opaque `secondary` (`#00cffc`) with a very soft outer glow of the same color.

### Specialized Component: The "Growth Glow"
For financial charts, the area under the line should use a gradient transition from `tertiary` (`#58ffd7`) at 30% opacity to 0% opacity. This creates a "pulsing energy" feel.

## 6. Do's and Don'ts

### Do
* **Do** center-align large financial amounts using `display-lg`.
* **Do** use asymmetrical spacing to create visual interest in list items.
* **Do** use `full` (pill) rounding for chips and small action tags to keep the "friendly" tone.
* **Do** leverage the `surface-container` tiers to create depth without shadows.

### Don't
* **Don't** use 100% white (`#FFFFFF`) for body text; use `on-surface-variant` to reduce eye strain on dark backgrounds.
* **Don't** use sharp corners. Our minimum roundedness is `md` (0.75rem).
* **Don't** use standard "drop shadows." If it doesn't look like a soft light leak, don't use it.
* **Don't** use dividers or horizontal rules. Let the negative space do the work.