# ADR 0014 – Glassmorphism as the application visual language

**Status:** Accepted · **Date:** 2026-08-29 · **Supersedes:** – · **Superseded by:** –

## Context

Flyte is used on phones and laptops, including current iPhones and MacBooks, often outdoors.
The owner decided on 2026-08-29 that the product's visual language is **glassmorphism**:
translucent, blurred materials with a specular edge, in the manner of current Apple system
chrome (large radius, layered depth, system type). This is a product decision, not a
per-screen decoration.

Forces that conflict with a naive "frosted glass" trend:

- PRD §6 requires the UI to stay **legible in direct sunlight**.
- Night mode exists so a cockpit does not get a white flash; red preserves dark adaptation
  ([PRD](../PRD.md) §5.6, FLY-015).
- Touch targets stay ≥ 44 px; the app is used in gloves.
- `prefers-reduced-transparency` must not leave the UI unreadable or empty.

## Decision

Every user-facing surface uses the **glass material** defined by CSS tokens in
`packages/ui` (`--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`,
`--radius-*`). Chrome (top bar, cards, fields, buttons) is translucent over a layered
atmosphere, not a flat opaque grey slab.

Three named themes share the same material, not three unrelated palettes:

| Theme | Atmosphere | Glass |
|---|---|---|
| `light` | Pale daylight wash | High-fill white glass (sunlight) |
| `dark` | Deep navy with colour blooms | Mid-fill dark glass (default) |
| `night` | Near-black with dim red | **More opaque** red glass, never a white flash |

Opacity is a token so Phase 8 can expose a transparency slider. Until then, fills stay
**higher than typical marketing glassmorphism** so sunlight and night both remain readable.

`prefers-reduced-transparency: reduce` turns blur off and uses solid `--bg` fills.

Do not:

- Introduce a second visual language (flat Material, neumorphism, "admin dashboard grey").
- Use white-on-red or a rebadged dark-grey for night.
- Drop below 44 px to make a control look more "delicate".
- Put glass *on printed OFP/FPL* – print is the training organisation's template
  ([DATA_SOURCES.md](../DATA_SOURCES.md) §10).

New screens and `@flyte/ui` components consume these tokens. shadcn copy-in (FLY-015 /
[ADR 0013](0013-shadcn-ui.md)) must be restyled to the glass tokens; the CLI's default
zinc theme is not the product.

## Consequences

- Agents that "helpfully" restyle a page to opaque cards are undoing an owner decision.
- Contrast is a safety concern here, not only an aesthetic one. When in doubt, raise
  `--glass-bg` opacity rather than thinning the fill.
- Backdrop-filter is Chromium/WebKit/Firefox-standard; reduced-transparency is the
  fallback, not a second design.
